import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { auth } from '@/app/api/auth/[...nextauth]/route'

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

    return NextResponse.json(workout)
  } catch (error) {
    console.error('Get workout error:', error)
    return NextResponse.json({ error: 'Failed to get workout' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, notes, steps } = body

    // Delete existing steps and create new ones
    await prisma.workoutStep.deleteMany({
      where: { workoutId: id }
    })

    const workout = await prisma.workout.update({
      where: { id },
      data: {
        name,
        notes: notes || '',
        steps: {
          create: steps.map((step: any) => ({
            position: step.position,
            type: step.type,
            measure: step.measure,
            value: parseFloat(step.value) || 0,
            unit: step.unit,
            zone: step.zone || null
          }))
        }
      },
      include: {
        steps: true
      }
    })

    return NextResponse.json({ workout })
  } catch (error) {
    console.error('Update workout error:', error)
    return NextResponse.json({ error: 'Failed to update workout' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.workout.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete workout error:', error)
    return NextResponse.json({ error: 'Failed to delete workout' }, { status: 500 })
  }
}