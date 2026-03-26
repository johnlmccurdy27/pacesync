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
    encoder.onMesg(Profile.MesgNum.FILE_ID, {
      type: 'workout',
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

    // 3. WORKOUT MESSAGE
    encoder.onMesg(Profile.MesgNum.WORKOUT, {
      messageIndex: 0,
      wktName: workout.name,
      sport: 'running',
      subSport: 'generic',
      capabilities: 'tcx',
      numValidSteps: workout.steps.length
    })

    // 4. WORKOUT STEPS
    workout.steps.forEach((step: any, index: number) => {
      const stepData: any = {
        messageIndex: index,
        intensity: getIntensityString(step.type),
        targetValue: 0,
        secondaryTargetValue: 0,
        weightDisplayUnit: 'kilogram'
      }

      // Duration
      if (step.measure === 'distance') {
        stepData.durationType = 'distance'
        stepData.durationValue = convertToMeters(step.value, step.unit) * 100 // centimeters
      } else {
        stepData.durationType = 'time'
        stepData.durationValue = convertToSeconds(step.value, step.unit) * 1000 // milliseconds
      }

      // Target (heart rate zones)
      if (step.zone && step.zone.toLowerCase() !== 'easy') {
        stepData.targetType = 'heartRate'
        stepData.targetValue = getHRZoneNumber(step.zone)
      } else {
        stepData.targetType = 'open'
        stepData.targetValue = 0
      }

      // Add notes if present
      if (workout.notes) {
        stepData.notes = workout.notes
      }

      encoder.onMesg(Profile.MesgNum.WORKOUT_STEP, stepData)
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

function getIntensityString(type: string): string {
  switch (type.toLowerCase()) {
    case 'warmup': return 'warmup'
    case 'cooldown': return 'cooldown'
    case 'recovery': return 'rest'
    case 'interval': return 'active'
    case 'main': return 'active'
    default: return 'active'
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