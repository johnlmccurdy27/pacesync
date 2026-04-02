import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { auth } from '@/app/api/auth/[...nextauth]/route'

const prisma = new PrismaClient()

// Create or retrieve a thread
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const { coachId, athleteId } = await request.json()

    let resolvedCoachId: string
    let resolvedAthleteId: string

    if (user.isCoach && athleteId) {
      resolvedCoachId = user.id
      resolvedAthleteId = athleteId
    } else if (user.isAthlete && coachId) {
      resolvedCoachId = coachId
      resolvedAthleteId = user.id
    } else {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const thread = await prisma.messageThread.upsert({
      where: { coachId_athleteId: { coachId: resolvedCoachId, athleteId: resolvedAthleteId } },
      create: { coachId: resolvedCoachId, athleteId: resolvedAthleteId },
      update: {},
    })

    return NextResponse.json({ threadId: thread.id })
  } catch (error) {
    console.error('Create thread error:', error)
    return NextResponse.json({ error: 'Failed to create thread' }, { status: 500 })
  }
}
