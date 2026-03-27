import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { auth } from '@/app/api/auth/[...nextauth]/route'

const prisma = new PrismaClient()

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url)
    const start = searchParams.get('start')
    const end = searchParams.get('end')

    const assignments = await prisma.workoutAssignment.findMany({
      where: {
        group: {
          coachId: user.id
        },
        ...(start && end ? {
          scheduledFor: {
            gte: new Date(start),
            lte: new Date(end)
          }
        } : {})
      },
      include: {
        workout: {
          select: {
            id: true,
            name: true,
            notes: true
          }
        },
        // deviceSyncId and corosSyncId are on the assignment itself — included by default
        group: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        scheduledFor: 'asc'
      }
    })

    return NextResponse.json(assignments)
  } catch (error) {
    console.error('Get assignments error:', error)
    return NextResponse.json({ error: 'Failed to get assignments' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { workoutId, groupId, scheduledFor } = body

    const assignment = await prisma.workoutAssignment.create({
      data: {
        workoutId,
        groupId,
        scheduledFor: new Date(scheduledFor)
      },
      include: {
        workout: true,
        group: true
      }
    })

    return NextResponse.json({ assignment })
  } catch (error) {
    console.error('Create assignment error:', error)
    return NextResponse.json({ error: 'Failed to create assignment' }, { status: 500 })
  }
}