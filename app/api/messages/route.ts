import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { auth } from '@/app/api/auth/[...nextauth]/route'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    if (user.isCoach) {
      const threads = await prisma.messageThread.findMany({
        where: { coachId: user.id },
        include: {
          athlete: { select: { id: true, name: true, email: true, profilePicture: true } },
          messages: {
            where: { senderId: { not: user.id }, readAt: null },
            select: { id: true },
          },
        },
        orderBy: { lastMessageAt: 'desc' },
      })

      return NextResponse.json({
        role: 'coach',
        threads: threads.map(t => ({
          id: t.id,
          athlete: t.athlete,
          unreadCount: t.messages.length,
          lastMessageAt: t.lastMessageAt,
        })),
      })
    }

    // Athlete: find unique coaches from group memberships
    const memberships = await prisma.groupMember.findMany({
      where: { athleteId: user.id },
      include: { group: { include: { coach: { select: { id: true, name: true, email: true, profilePicture: true } } } } },
    })

    const coachMap = new Map<string, { id: string; name: string | null; email: string; profilePicture: string | null }>()
    for (const m of memberships) {
      if (!coachMap.has(m.group.coachId)) coachMap.set(m.group.coachId, m.group.coach)
    }

    const coaches = Array.from(coachMap.values())
    const threads = await prisma.messageThread.findMany({
      where: { athleteId: user.id },
      select: { id: true, coachId: true, lastMessageAt: true, messages: { where: { senderId: { not: user.id }, readAt: null }, select: { id: true } } },
    })

    const threadByCoach = new Map(threads.map(t => [t.coachId, t]))

    return NextResponse.json({
      role: 'athlete',
      coaches: coaches.map(coach => {
        const thread = threadByCoach.get(coach.id)
        return { coach, threadId: thread?.id || null, unreadCount: thread?.messages.length || 0 }
      }),
    })
  } catch (error) {
    console.error('Get messages error:', error)
    return NextResponse.json({ error: 'Failed to get messages' }, { status: 500 })
  }
}
