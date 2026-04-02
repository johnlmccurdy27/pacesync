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
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const group = await prisma.group.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            athlete: {
              select: {
                id: true,
                name: true,
                email: true,
                profilePicture: true,
                clubName: true,
                discipline: true
              }
            }
          },
          orderBy: {
            joinedAt: 'asc'
          }
        },
        _count: {
          select: { workouts: true }
        }
      }
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    return NextResponse.json(group)
  } catch (error) {
    console.error('Get group error:', error)
    return NextResponse.json({ error: 'Failed to get group' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const group = await prisma.group.findUnique({ where: { id } })
    if (!group || group.coachId !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const { name, description, raceName, raceDate } = await request.json()

    const updated = await prisma.group.update({
      where: { id },
      data: {
        name,
        description: description || null,
        raceName: raceName || null,
        raceDate: raceDate ? new Date(raceDate) : null,
      },
      include: { _count: { select: { members: true } } }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Update group error:', error)
    return NextResponse.json({ error: 'Failed to update group' }, { status: 500 })
  }
}