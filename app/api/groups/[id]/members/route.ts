import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { auth } from '@/app/api/auth/[...nextauth]/route'

const prisma = new PrismaClient()

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const coach = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!coach) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { id: groupId } = await params

  const group = await prisma.group.findUnique({ where: { id: groupId } })
  if (!group || group.coachId !== coach.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { athleteId } = await request.json()

  const athlete = await prisma.user.findUnique({ where: { id: athleteId } })
  if (!athlete) return NextResponse.json({ error: 'Athlete not found' }, { status: 404 })

  const existing = await prisma.groupMember.findUnique({
    where: { groupId_athleteId: { groupId, athleteId } }
  })
  if (existing) return NextResponse.json({ error: 'Athlete is already in this group' }, { status: 400 })

  const member = await prisma.groupMember.create({
    data: { groupId, athleteId },
    include: { athlete: { select: { id: true, name: true, email: true } } }
  })

  return NextResponse.json(member)
}
