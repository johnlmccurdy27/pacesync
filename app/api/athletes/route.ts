import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { auth } from '@/app/api/auth/[...nextauth]/route'

const prisma = new PrismaClient()

export async function GET() {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const coach = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!coach) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // All users with athlete role, with their group memberships attached
  const athletes = await prisma.user.findMany({
    where: { isAthlete: true },
    select: {
      id: true,
      name: true,
      email: true,
      profilePicture: true,
      clubName: true,
      discipline: true,
      createdAt: true,
      athleteGroups: {
        include: { group: { select: { id: true, name: true } } }
      }
    },
    orderBy: { name: 'asc' }
  })

  return NextResponse.json(athletes.map(a => ({
    ...a,
    groups: a.athleteGroups.map(m => m.group),
    athleteGroups: undefined
  })))
}
