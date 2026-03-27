import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { auth } from '@/app/api/auth/[...nextauth]/route'

const prisma = new PrismaClient()

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { garminEmail, garminPassword } = await request.json()
  if (!garminEmail || !garminPassword) return NextResponse.json({ error: 'Email and password required' }, { status: 400 })

  // Delete existing garmin connection then create fresh
  await prisma.watchConnection.deleteMany({ where: { userId: user.id, platform: 'garmin' } })
  await prisma.watchConnection.create({
    data: {
      userId: user.id,
      platform: 'garmin',
      accessToken: garminEmail,
      refreshToken: garminPassword,
    }
  })

  return NextResponse.json({ success: true })
}

export async function DELETE() {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  await prisma.watchConnection.deleteMany({ where: { userId: user.id, platform: 'garmin' } })
  return NextResponse.json({ success: true })
}
