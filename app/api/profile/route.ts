import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { auth } from '@/app/api/auth/[...nextauth]/route'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true, name: true, email: true, role: true, bio: true, clubName: true,
        discipline: true, profilePicture: true, createdAt: true, watchConnections: true,
        athleteGroups: {
          include: {
            group: {
              select: {
                coach: { select: { name: true, email: true, profilePicture: true, clubName: true } }
              }
            }
          }
        }
      }
    })

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Derive unique coaches from group memberships
    const coachMap = new Map<string, { name: string | null; email: string; profilePicture: string | null; clubName: string | null }>()
    user.athleteGroups?.forEach(m => {
      const c = m.group.coach
      if (!coachMap.has(c.email)) coachMap.set(c.email, c)
    })
    const coaches = Array.from(coachMap.values())

    return NextResponse.json({ ...user, coaches })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get profile' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { name, bio, clubName, discipline, profilePicture } = body

    const user = await prisma.user.update({
      where: { email: session.user.email },
      data: { name, bio, clubName, discipline, profilePicture },
      select: { id: true, name: true, email: true, role: true, bio: true, clubName: true, discipline: true, profilePicture: true }
    })

    return NextResponse.json(user)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
