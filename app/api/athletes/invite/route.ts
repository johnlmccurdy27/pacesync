import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { randomBytes } from 'crypto'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import { sendAthleteInviteEmail } from '@/lib/email'

const prisma = new PrismaClient()

// POST /api/athletes/invite — coach invites an athlete by email
export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const coach = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!coach || coach.role !== 'coach') {
      return NextResponse.json({ error: 'Only coaches can send invites' }, { status: 403 })
    }

    const { email } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Don't invite someone who already has an account
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      )
    }

    const token = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    const invite = await prisma.athleteInvite.create({
      data: { email, coachId: coach.id, token, expiresAt }
    })

    await sendAthleteInviteEmail(email, coach.name, token)

    return NextResponse.json({ invite: { id: invite.id, email: invite.email } })
  } catch (error) {
    console.error('Invite error:', error)
    return NextResponse.json({ error: 'Failed to send invite' }, { status: 500 })
  }
}

// GET /api/athletes/invite?token=XXX — look up invite details for the signup page
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 })
  }

  const invite = await prisma.athleteInvite.findUnique({ where: { token } })

  if (!invite || invite.usedAt || invite.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Invalid or expired invite' }, { status: 404 })
  }

  return NextResponse.json({ email: invite.email })
}
