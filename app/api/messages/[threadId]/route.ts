import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import { sendNewMessageEmail } from '@/lib/email'

const prisma = new PrismaClient()

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const { threadId } = await params
    const session = await auth()
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const thread = await prisma.messageThread.findUnique({
      where: { id: threadId },
      include: {
        messages: { include: { sender: { select: { id: true, name: true, profilePicture: true } } }, orderBy: { createdAt: 'asc' } },
        coach: { select: { id: true, name: true, email: true, profilePicture: true } },
        athlete: { select: { id: true, name: true, email: true, profilePicture: true } },
      },
    })

    if (!thread || (thread.coachId !== user.id && thread.athleteId !== user.id)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Mark incoming messages as read
    await prisma.message.updateMany({
      where: { threadId, senderId: { not: user.id }, readAt: null },
      data: { readAt: new Date() },
    })

    return NextResponse.json(thread)
  } catch (error) {
    console.error('Get thread error:', error)
    return NextResponse.json({ error: 'Failed to get thread' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const { threadId } = await params
    const session = await auth()
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const thread = await prisma.messageThread.findUnique({
      where: { id: threadId },
      include: {
        coach: { select: { id: true, name: true, email: true } },
        athlete: { select: { id: true, name: true, email: true } },
      },
    })
    if (!thread || (thread.coachId !== user.id && thread.athleteId !== user.id)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const { body } = await request.json()
    if (!body?.trim()) return NextResponse.json({ error: 'Message body required' }, { status: 400 })

    // Determine recipient
    const recipient = user.id === thread.coachId ? thread.athlete : thread.coach
    const senderRole = user.id === thread.coachId ? 'coach' : 'athlete'

    // Only email if recipient has no existing unread messages (avoid inbox flood)
    const existingUnread = await prisma.message.count({
      where: { threadId, senderId: user.id, readAt: null },
    })

    const [message] = await prisma.$transaction([
      prisma.message.create({
        data: { threadId, senderId: user.id, body: body.trim() },
        include: { sender: { select: { id: true, name: true, profilePicture: true } } },
      }),
      prisma.messageThread.update({
        where: { id: threadId },
        data: { lastMessageAt: new Date() },
      }),
    ])

    // Fire notification email (non-blocking)
    if (existingUnread === 0) {
      sendNewMessageEmail(recipient.email, recipient.name, user.name, senderRole).catch(() => {})
    }

    return NextResponse.json(message)
  } catch (error) {
    console.error('Send message error:', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
