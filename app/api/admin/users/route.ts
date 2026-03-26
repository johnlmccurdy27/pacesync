import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { auth } from '@/app/api/auth/[...nextauth]/route'

const prisma = new PrismaClient()

export async function GET() {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const requester = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!requester?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isAdmin: true,
      isCoach: true,
      isAthlete: true,
      clubName: true,
      discipline: true,
      createdAt: true,
    }
  })

  return NextResponse.json(users)
}
