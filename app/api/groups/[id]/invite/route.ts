import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import bcrypt from 'bcryptjs'
import { sendAthleteInviteEmail } from '@/lib/email'
import { randomBytes } from 'crypto'

const prisma = new PrismaClient()

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: groupId } = await params
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const coach = await prisma.user.findUnique({ where: { email: session.user.email } })

    const body = await request.json()
    const { email, name } = body

    // Check if user already exists
    let athlete = await prisma.user.findUnique({
      where: { email }
    })

    // If not, create a new athlete account with temporary password
    if (!athlete) {
      const tempPassword = Math.random().toString(36).slice(-8)
      const hashedPassword = await bcrypt.hash(tempPassword, 10)

      athlete = await prisma.user.create({
        data: {
          email,
          name: name || null,
          password: hashedPassword,
          role: 'athlete'
        }
      })

      const token = randomBytes(32).toString('hex')
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      await prisma.athleteInvite.create({ data: { email, coachId: coach!.id, token, expiresAt } })
      await sendAthleteInviteEmail(email, coach?.name ?? coach!.email, token)
    }

    // Check if already a member
    const existingMember = await prisma.groupMember.findUnique({
      where: {
        groupId_athleteId: {
          groupId,
          athleteId: athlete.id
        }
      }
    })

    if (existingMember) {
      return NextResponse.json({ error: 'Athlete is already a member' }, { status: 400 })
    }

    // Add to group
    const member = await prisma.groupMember.create({
      data: {
        groupId,
        athleteId: athlete.id
      },
      include: {
        athlete: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({ member })
  } catch (error) {
    console.error('Invite athlete error:', error)
    return NextResponse.json({ error: 'Failed to invite athlete' }, { status: 500 })
  }
}