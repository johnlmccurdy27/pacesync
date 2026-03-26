import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { auth } from '@/app/api/auth/[...nextauth]/route'

const prisma = new PrismaClient()

export async function GET() {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const coach = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!coach) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // All group members across all of this coach's groups
  const memberships = await prisma.groupMember.findMany({
    where: { group: { coachId: coach.id } },
    include: {
      athlete: {
        select: {
          id: true,
          name: true,
          email: true,
          profilePicture: true,
          clubName: true,
          discipline: true,
          createdAt: true,
        }
      },
      group: { select: { id: true, name: true } }
    }
  })

  // Deduplicate — one entry per athlete, with all their groups listed
  const athleteMap = new Map<string, {
    id: string; name: string | null; email: string;
    profilePicture: string | null; clubName: string | null;
    discipline: string | null; createdAt: Date;
    groups: { id: string; name: string }[]
  }>()

  for (const m of memberships) {
    if (!athleteMap.has(m.athleteId)) {
      athleteMap.set(m.athleteId, { ...m.athlete, groups: [] })
    }
    athleteMap.get(m.athleteId)!.groups.push(m.group)
  }

  return NextResponse.json(Array.from(athleteMap.values()))
}
