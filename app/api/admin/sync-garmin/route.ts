import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { auth } from '@/app/api/auth/[...nextauth]/route'

const prisma = new PrismaClient()

function garminStepType(type: string) {
  switch (type.toLowerCase()) {
    case 'warmup':   return { stepTypeId: 1, stepTypeKey: 'warmup' }
    case 'cooldown': return { stepTypeId: 2, stepTypeKey: 'cooldown' }
    case 'recovery': return { stepTypeId: 4, stepTypeKey: 'recovery' }
    case 'rest':     return { stepTypeId: 5, stepTypeKey: 'rest' }
    default:         return { stepTypeId: 3, stepTypeKey: 'interval' }
  }
}

function buildExecutableStep(step: any, stepOrder: number) {
  const isDistance = step.measure === 'distance'
  let endConditionValue: number
  if (isDistance) {
    switch (step.unit.toLowerCase()) {
      case 'km': endConditionValue = step.value * 1000; break
      case 'mi': endConditionValue = Math.round(step.value * 1609.34); break
      default:   endConditionValue = step.value
    }
  } else {
    switch (step.unit.toLowerCase()) {
      case 'min': endConditionValue = step.value * 60; break
      case 'hr':  endConditionValue = step.value * 3600; break
      default:    endConditionValue = step.value
    }
  }
  return {
    type: 'ExecutableStepDTO',
    stepId: null,
    stepOrder,
    childStepId: null,
    description: null,
    stepType: garminStepType(step.type),
    endCondition: isDistance
      ? { conditionTypeId: 3, conditionTypeKey: 'distance' }
      : { conditionTypeId: 2, conditionTypeKey: 'time' },
    endConditionValue: Math.round(endConditionValue),
    preferredEndConditionUnit: isDistance ? { unitKey: 'meter' } : null,
    endConditionCompare: null,
    endConditionZone: null,
    targetType: { workoutTargetTypeId: 1, workoutTargetTypeKey: 'no.target' },
    targetValueOne: null,
    targetValueTwo: null,
    zoneNumber: null,
  }
}

function buildGarminWorkout(name: string, notes: string, steps: any[]) {
  const garminSteps: any[] = []
  let stepOrder = 1
  let i = 0

  while (i < steps.length) {
    const step = steps[i]

    if (!step.repeatGroup) {
      garminSteps.push(buildExecutableStep(step, stepOrder++))
      i++
    } else {
      // Collect all steps in this repeat group
      const groupId = step.repeatGroup
      const repeatCount = step.repeatCount || 1
      const childSteps: any[] = []
      let childOrder = 1

      while (i < steps.length && steps[i].repeatGroup === groupId) {
        childSteps.push(buildExecutableStep(steps[i], childOrder++))
        i++
      }

      garminSteps.push({
        type: 'RepeatGroupDTO',
        stepId: null,
        stepOrder: stepOrder++,
        childStepId: 1,
        numberOfIterations: repeatCount,
        smartRepeat: false,
        workoutSteps: childSteps,
      })
    }
  }

  return {
    workoutName: name,
    description: notes || 'Synced from Structur',
    sportType: { sportTypeId: 1, sportTypeKey: 'running' },
    workoutSegments: [{
      segmentOrder: 1,
      sportType: { sportTypeId: 1, sportTypeKey: 'running' },
      workoutSteps: garminSteps,
    }],
  }
}

async function syncAssignment(assignmentId: string) {
  const assignment = await prisma.workoutAssignment.findUnique({
    where: { id: assignmentId },
    include: {
      workout: { include: { steps: { orderBy: { position: 'asc' } } } },
      group: {
        include: {
          members: {
            include: {
              athlete: {
                include: {
                  watchConnections: { where: { platform: 'garmin' } }
                }
              }
            }
          }
        }
      }
    }
  })
  if (!assignment) throw new Error(`Assignment ${assignmentId} not found`)

  const athletesWithGarmin = assignment.group.members.filter(
    m => m.athlete.watchConnections.length > 0
  )

  if (athletesWithGarmin.length === 0) {
    return { assignmentId, synced: 0, skipped: 0, errors: [], message: 'No athletes have connected their Garmin account' }
  }

  const garminWorkout = buildGarminWorkout(
    assignment.workout.name,
    assignment.workout.notes,
    assignment.workout.steps
  )
  const d = assignment.scheduledFor
  const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

  let syncCount = 0
  const errors: string[] = []

  for (const member of athletesWithGarmin) {
    const conn = member.athlete.watchConnections[0]
    const label = member.athlete.name || member.athlete.email
    try {
      const { GarminConnect } = await import('garmin-connect')
      const client = new GarminConnect({
        username: conn.accessToken,
        password: conn.refreshToken!,
      })
      await client.login()
      const result = await client.addWorkout(garminWorkout as any)
      const deviceSyncId = String((result as any)?.workoutId ?? '')
      await (client as any).client.post(
        `https://connectapi.garmin.com/workout-service/schedule/${deviceSyncId}`,
        { date: dateStr }
      )
      syncCount++
    } catch (err: any) {
      const msg = err?.message ?? 'Unknown error'
      if (msg.toLowerCase().includes('mfa') || msg.toLowerCase().includes('ticket not found')) {
        errors.push(`${label}: Garmin 2FA/MFA is enabled — athlete must disable two-factor authentication in Garmin Connect account settings`)
      } else {
        errors.push(`${label}: ${msg}`)
      }
    }
  }

  // Mark assignment as synced with count
  if (syncCount > 0) {
    await prisma.workoutAssignment.update({
      where: { id: assignmentId },
      data: { deviceSyncId: `synced:${syncCount}` }
    })
  }

  return { assignmentId, synced: syncCount, skipped: 0, errors }
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { assignmentIds } = await request.json() as { assignmentIds: string[] }
  if (!assignmentIds?.length) return NextResponse.json({ error: 'assignmentIds required' }, { status: 400 })

  try {
    const results = []
    for (const id of assignmentIds) {
      results.push(await syncAssignment(id))
    }
    const totalSynced = results.reduce((sum, r) => sum + r.synced, 0)
    const allErrors = results.flatMap(r => r.errors)
    return NextResponse.json({ success: true, totalSynced, errors: allErrors, results })
  } catch (error: any) {
    console.error('Device sync error:', error)
    return NextResponse.json({ error: error?.message ?? 'Sync failed' }, { status: 500 })
  }
}
