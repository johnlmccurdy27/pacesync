import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { auth } from '@/app/api/auth/[...nextauth]/route'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.email) return NextResponse.json({ count: 0 })

    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) return NextResponse.json({ count: 0 })

    const count = await prisma.message.count({
      where: {
        senderId: { not: user.id },
        readAt: null,
        thread: user.isCoach
          ? { coachId: user.id }
          : { athleteId: user.id },
      },
    })

    return NextResponse.json({ count })
  } catch {
    return NextResponse.json({ count: 0 })
  }
}
