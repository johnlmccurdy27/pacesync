import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { auth } from '@/app/api/auth/[...nextauth]/route'

const prisma = new PrismaClient()

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const activities = await prisma.activity.findMany({
    where: { userId: id },
    orderBy: { startTime: 'desc' },
    take: 20,
    include: {
      assignment: {
        include: { workout: { select: { name: true } } }
      }
    }
  })

  return NextResponse.json(activities)
}
