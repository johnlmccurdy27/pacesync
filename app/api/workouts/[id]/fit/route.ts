import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const workout = await prisma.workout.findUnique({
      where: { id },
      include: {
        steps: {
          orderBy: { position: 'asc' }
        }
      }
    })

    if (!workout) {
      return NextResponse.json({ error: 'Workout not found' }, { status: 404 })
    }

    // Dynamically import the Garmin FIT SDK
    const { Encoder, Profile } = await import('@garmin/fitsdk')

    // Create encoder
    const encoder = new Encoder()

    // 1. FILE ID - REQUIRED
    // Use numeric enum value 5 = workout (4=activity, 5=workout, 6=course/route)
    encoder.onMesg(Profile.MesgNum.FILE_ID, {
      type: Profile.File?.WORKOUT ?? 5,
      manufacturer: 'garmin',
      product: 65534,
      serialNumber: 12345,
      timeCreated: new Date(workout.createdAt)
    })

    // 2. FILE CREATOR - REQUIRED
    encoder.onMesg(Profile.MesgNum.FILE_CREATOR, {
      softwareVersion: 0,
      hardwareVersion: 0
    })

    // 3. BUILD FIT STEP LIST
    // Walk steps in order. Repeat groups emit their child steps then a Garmin
    // "repeatUntilStepsCmplt" pointer step. Single steps emit as-is.
    // durationType 6 = repeatUntilStepsCmplt (Garmin FIT protocol)
    const steps = workout.steps  // already ordered by position

    interface FitEntry { type: 'step' | 'repeat'; data: any }
    const fitEntries: FitEntry[] = []
    let messageIndex = 0
    let i = 0

    while (i < steps.length) {
      const step = steps[i] as any

      if (!step.repeatGroup) {
        // Regular standalone step
        fitEntries.push({ type: 'step', data: buildStepData(step, messageIndex) })
        messageIndex++
        i++
      } else {
        // Repeat group — collect all steps sharing the same repeatGroup ID
        const groupId = step.repeatGroup
        const repeatCount = step.repeatCount || 1
        const groupStartIndex = messageIndex

        while (i < steps.length && (steps[i] as any).repeatGroup === groupId) {
          fitEntries.push({ type: 'step', data: buildStepData(steps[i] as any, messageIndex) })
          messageIndex++
          i++
        }

        // Garmin repeat pointer step: go back to groupStartIndex, repeat N times
        // Note: repeat pointer steps must NOT include targetType — only durationValue (first step index) and targetValue (count)
        fitEntries.push({
          type: 'repeat',
          data: {
            messageIndex,
            durationType: 6,         // repeatUntilStepsCmplt
            durationValue: groupStartIndex,  // messageIndex of first step in group
            targetValue: repeatCount,
          }
        })
        messageIndex++
      }
    }

    // 4. WORKOUT MESSAGE (numValidSteps = total FIT steps including repeat pointers)
    encoder.onMesg(Profile.MesgNum.WORKOUT, {
      messageIndex: 0,
      wktName: workout.name,
      sport: 1,
      subSport: 0,
      numValidSteps: fitEntries.length,
    })

    // 5. EMIT ALL WORKOUT STEPS
    fitEntries.forEach(entry => {
      encoder.onMesg(Profile.MesgNum.WORKOUT_STEP, entry.data)
    })

    // Close encoder and get the Uint8Array
    const uint8Array = encoder.close()

    // Convert to Buffer
    const buffer = Buffer.from(uint8Array)

    // Return as downloadable file
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${workout.name.replace(/\s+/g, '_')}.fit"`
      }
    })
  } catch (error) {
    console.error('Generate FIT file error:', error)
    return NextResponse.json({ 
      error: 'Failed to generate FIT file',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

function buildStepData(step: any, messageIndex: number): any {
  const data: any = {
    messageIndex,
    intensity: getIntensityValue(step.type),
  }

  if (step.measure === 'distance') {
    data.durationType = 1 // distance
    data.durationValue = Math.round(convertToMeters(step.value, step.unit) * 100) // centimeters
  } else {
    data.durationType = 0 // time
    data.durationValue = Math.round(convertToSeconds(step.value, step.unit) * 1000) // milliseconds
  }

  // Recovery/rest steps use open target; all others use HR zone if set
  const type = step.type?.toLowerCase()
  if ((type === 'recovery' || type === 'rest') || !step.zone || step.zone.toLowerCase() === 'easy') {
    data.targetType = 2 // open
    data.targetValue = 0
  } else {
    data.targetType = 1 // heartRate
    data.targetValue = getHRZoneNumber(step.zone)
  }

  return data
}

function convertToMeters(value: number, unit: string): number {
  switch (unit.toLowerCase()) {
    case 'km': return value * 1000
    case 'mi': return value * 1609.34
    case 'm': return value
    default: return value * 1000
  }
}

function convertToSeconds(value: number, unit: string): number {
  switch (unit.toLowerCase()) {
    case 'min': return value * 60
    case 'sec': return value
    case 'hr': return value * 3600
    default: return value * 60
  }
}

function getIntensityValue(type: string): number {
  // Garmin FIT Intensity enum: 0=active, 1=rest, 2=warmup, 3=cooldown, 4=recovery, 5=interval
  switch (type.toLowerCase()) {
    case 'warmup': return 2
    case 'cooldown': return 3
    case 'recovery': return 1   // rest
    case 'rest': return 1       // rest
    case 'interval': return 0   // active
    case 'main': return 0       // active
    default: return 0
  }
}

function getHRZoneNumber(zone: string | null): number {
  if (!zone) return 0
  
  // Map to HR zones 1-5
  switch (zone.toLowerCase()) {
    case 'easy': return 1
    case 'moderate': return 2
    case 'tempo': return 3
    case 'threshold': return 4
    case 'vo2max': return 5
    case 'sprint': return 5
    default: return 0
  }
}