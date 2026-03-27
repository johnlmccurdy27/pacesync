import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import path from 'path'
import fs from 'fs'
import os from 'os'

const prisma = new PrismaClient()
const TOKEN_DIR = path.join(process.cwd(), '.coros-tokens')

// ── FIT file generation (mirrors /api/workouts/[id]/fit) ─────────────────────

function convertToMeters(value: number, unit: string): number {
  switch (unit.toLowerCase()) {
    case 'km': return value * 1000
    case 'mi': return value * 1609.34
    case 'm':  return value
    default:   return value * 1000
  }
}

function convertToSeconds(value: number, unit: string): number {
  switch (unit.toLowerCase()) {
    case 'min': return value * 60
    case 'sec': return value
    case 'hr':  return value * 3600
    default:    return value * 60
  }
}

function getIntensityValue(type: string): number {
  switch (type.toLowerCase()) {
    case 'warmup':   return 2
    case 'cooldown': return 3
    case 'recovery': return 4
    case 'interval': return 5
    case 'main':     return 0
    default:         return 0
  }
}

function getHRZoneNumber(zone: string | null): number {
  if (!zone) return 0
  switch (zone.toLowerCase()) {
    case 'easy':      return 1
    case 'moderate':  return 2
    case 'tempo':     return 3
    case 'threshold': return 4
    case 'vo2max':    return 5
    case 'sprint':    return 5
    default:          return 0
  }
}

async function generateFitBuffer(workout: { name: string; createdAt: Date; steps: any[] }): Promise<Buffer> {
  const { Encoder, Profile } = await import('@garmin/fitsdk')
  const encoder = new Encoder()

  encoder.onMesg(Profile.MesgNum.FILE_ID, {
    type: Profile.File?.WORKOUT ?? 5,
    manufacturer: 'garmin',
    product: 65534,
    serialNumber: 12345,
    timeCreated: new Date(workout.createdAt)
  })

  encoder.onMesg(Profile.MesgNum.FILE_CREATOR, {
    softwareVersion: 0,
    hardwareVersion: 0
  })

  encoder.onMesg(Profile.MesgNum.WORKOUT, {
    messageIndex: 0,
    wktName: workout.name,
    sport: 1,
    subSport: 0,
    numValidSteps: workout.steps.length
  })

  workout.steps.forEach((step: any, index: number) => {
    const stepData: any = {
      messageIndex: index,
      intensity: getIntensityValue(step.type),
    }
    if (step.measure === 'distance') {
      stepData.durationType = 1
      stepData.durationValue = Math.round(convertToMeters(step.value, step.unit) * 100)
    } else {
      stepData.durationType = 0
      stepData.durationValue = Math.round(convertToSeconds(step.value, step.unit) * 1000)
    }
    if (step.zone && step.zone.toLowerCase() !== 'easy') {
      stepData.targetType = 1
      stepData.targetValue = getHRZoneNumber(step.zone)
    } else {
      stepData.targetType = 2
      stepData.targetValue = 0
    }
    encoder.onMesg(Profile.MesgNum.WORKOUT_STEP, stepData)
  })

  return Buffer.from(encoder.close())
}

// ── Coros client ──────────────────────────────────────────────────────────────

async function getCorosClient(athleteDbId: string, email: string, password: string) {
  const { CorosApi, STSConfigs, isDirectory } = await import('coros-connect')

  const client = new CorosApi()
  client.config({ stsConfig: STSConfigs.EU })
  client.updateCredentials({ email, password })

  const tokenDir = path.join(TOKEN_DIR, athleteDbId)

  if (isDirectory(tokenDir)) {
    try {
      client.loadTokenByFile(tokenDir)
      return client
    } catch {
      // Fall through to fresh login
    }
  }

  await client.login()
  if (!fs.existsSync(TOKEN_DIR)) fs.mkdirSync(TOKEN_DIR, { recursive: true })
  client.exportTokenToFile(tokenDir)
  return client
}

async function getCorosClientWithReauth(athleteDbId: string, email: string, password: string) {
  const { CorosApi, STSConfigs } = await import('coros-connect')
  try {
    return await getCorosClient(athleteDbId, email, password)
  } catch {
    // Token invalid — force fresh login
    const tokenDir = path.join(TOKEN_DIR, athleteDbId)
    if (fs.existsSync(tokenDir)) fs.rmSync(tokenDir, { recursive: true, force: true })
    const client = new CorosApi()
    client.config({ stsConfig: STSConfigs.EU })
    client.updateCredentials({ email, password })
    await client.login()
    if (!fs.existsSync(TOKEN_DIR)) fs.mkdirSync(TOKEN_DIR, { recursive: true })
    client.exportTokenToFile(tokenDir)
    return client
  }
}

// ── Sync one assignment to all athletes in the group with Coros ───────────────

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
                  watchConnections: { where: { platform: 'coros' } }
                }
              }
            }
          }
        }
      }
    }
  })
  if (!assignment) throw new Error(`Assignment ${assignmentId} not found`)

  const athletesWithCoros = assignment.group.members.filter(
    m => m.athlete.watchConnections.length > 0
  )

  if (athletesWithCoros.length === 0) {
    return { assignmentId, synced: 0, errors: [], message: 'No athletes have connected their Coros account' }
  }

  // Generate FIT buffer once, reuse for all athletes
  const fitBuffer = await generateFitBuffer(assignment.workout)

  // Write to a temp file (uploadActivityFile requires a file path)
  const tmpPath = path.join(os.tmpdir(), `structur-${assignmentId}-${Date.now()}.fit`)
  fs.writeFileSync(tmpPath, fitBuffer)

  let syncCount = 0
  const errors: string[] = []

  try {
    for (const member of athletesWithCoros) {
      const conn = member.athlete.watchConnections[0]
      const label = member.athlete.name || member.athlete.email
      try {
        const client = await getCorosClientWithReauth(
          member.athlete.id,
          conn.accessToken,
          conn.refreshToken!
        )
        // Get userId from account (needed for upload)
        const account = await client.getAccount()
        const userId = account.userId
        await client.uploadActivityFile(tmpPath, userId)
        syncCount++
      } catch (err: any) {
        // Retry once on auth failure
        try {
          const tokenDir = path.join(TOKEN_DIR, member.athlete.id)
          if (fs.existsSync(tokenDir)) fs.rmSync(tokenDir, { recursive: true, force: true })
          const { CorosApi, STSConfigs } = await import('coros-connect')
          const client = new CorosApi()
          client.config({ stsConfig: STSConfigs.EU })
          client.updateCredentials({ email: conn.accessToken, password: conn.refreshToken! })
          await client.login()
          client.exportTokenToFile(path.join(TOKEN_DIR, member.athlete.id))
          const account = await client.getAccount()
          await client.uploadActivityFile(tmpPath, account.userId)
          syncCount++
        } catch (retryErr: any) {
          errors.push(`${label}: ${retryErr?.message ?? 'Unknown error'}`)
        }
      }
    }
  } finally {
    // Always clean up temp file
    if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath)
  }

  if (syncCount > 0) {
    await prisma.workoutAssignment.update({
      where: { id: assignmentId },
      data: { corosSyncId: `synced:${syncCount}` }
    })
  }

  return { assignmentId, synced: syncCount, errors }
}

// ── Route handler ─────────────────────────────────────────────────────────────

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
    console.error('Coros sync error:', error)
    return NextResponse.json({ error: error?.message ?? 'Sync failed' }, { status: 500 })
  }
}
