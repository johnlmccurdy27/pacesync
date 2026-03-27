import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { auth } from '@/app/api/auth/[...nextauth]/route'

const prisma = new PrismaClient()

export async function GET() {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return NextResponse.json(null)

  const activity = await prisma.activity.findFirst({
    where: { userId: user.id },
    orderBy: { startTime: 'desc' },
    include: {
      assignment: { include: { workout: { select: { name: true } } } }
    }
  })

  return NextResponse.json(activity)
}
