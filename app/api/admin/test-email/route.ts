import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import { sendWelcomeEmail } from '@/lib/email'

const prisma = new PrismaClient()

export async function POST() {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const requester = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!requester?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await sendWelcomeEmail(requester.email, requester.name)

  return NextResponse.json({ success: true })
}
