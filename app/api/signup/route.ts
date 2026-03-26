import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { sendWelcomeEmail } from '@/lib/email'

const prisma = new PrismaClient()

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, password, role, inviteToken, clubName, discipline } = body

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      )
    }

    // Validate invite token if provided
    let invite = null
    if (inviteToken) {
      invite = await prisma.athleteInvite.findUnique({
        where: { token: inviteToken }
      })

      if (!invite) {
        return NextResponse.json({ error: 'Invalid invite link' }, { status: 400 })
      }
      if (invite.usedAt) {
        return NextResponse.json({ error: 'Invite link has already been used' }, { status: 400 })
      }
      if (invite.expiresAt < new Date()) {
        return NextResponse.json({ error: 'Invite link has expired' }, { status: 400 })
      }
      if (invite.email.toLowerCase() !== email.toLowerCase()) {
        return NextResponse.json(
          { error: 'This invite was sent to a different email address' },
          { status: 400 }
        )
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user — athletes arrive via invite, coaches sign up directly
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: invite ? 'athlete' : (role || 'coach'),
        clubName: clubName || null,
        discipline: discipline || null
      }
    })

    // Mark invite as used
    if (invite) {
      await prisma.athleteInvite.update({
        where: { id: invite.id },
        data: { usedAt: new Date() }
      })
    }

    // Send welcome email — fire and forget, don't fail signup if email fails
    sendWelcomeEmail(user.email, user.name).catch((err) =>
      console.error('Failed to send welcome email:', err)
    )

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    })
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    )
  }
}
