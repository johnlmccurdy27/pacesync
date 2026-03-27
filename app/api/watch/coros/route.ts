import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { auth } from '@/app/api/auth/[...nextauth]/route'

const prisma = new PrismaClient()

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { corosEmail, corosPassword } = await request.json()
  if (!corosEmail || !corosPassword) return NextResponse.json({ error: 'Email and password required' }, { status: 400 })

  await prisma.watchConnection.deleteMany({ where: { userId: user.id, platform: 'coros' } })
  await prisma.watchConnection.create({
    data: {
      userId: user.id,
      platform: 'coros',
      accessToken: corosEmail,
      refreshToken: corosPassword,
    }
  })

  return NextResponse.json({ success: true })
}

export async function DELETE() {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  await prisma.watchConnection.deleteMany({ where: { userId: user.id, platform: 'coros' } })
  return NextResponse.json({ success: true })
}
