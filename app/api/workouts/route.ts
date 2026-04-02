import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { auth } from '@/app/api/auth/[...nextauth]/route'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const workouts = await prisma.workout.findMany({
      where: {
        coachId: user.id
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        steps: {
          orderBy: {
            position: 'asc'
          }
        },
        coach: {
          select: { name: true, email: true }
        }
      }
    })

    return NextResponse.json(workouts)
  } catch (error) {
    console.error('Get workouts error:', error)
    return NextResponse.json({ error: 'Failed to get workouts' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, notes, steps } = body

    if (!name || !steps || steps.length === 0) {
      return NextResponse.json({ error: 'Invalid workout data' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const workout = await prisma.workout.create({
      data: {
        name,
        notes: notes || '',
        coachId: user.id,
        steps: {
          create: steps.map((step: any, index: number) => ({
            position: index,
            type: step.type,
            measure: step.measure,
            value: parseFloat(step.value) || 0,
            unit: step.unit,
            zone: step.zone || null,
            repeatCount: step.repeatCount ?? null,
            repeatGroup: step.repeatGroup ?? null,
          }))
        }
      },
      include: {
        steps: true
      }
    })

    return NextResponse.json({ workout })
  } catch (error: any) {
    console.error('Create workout error:', error)
    return NextResponse.json(
      { error: 'Failed to create workout' },
      { status: 500 }
    )
  }
}