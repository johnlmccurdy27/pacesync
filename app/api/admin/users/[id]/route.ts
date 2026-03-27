import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { auth } from '@/app/api/auth/[...nextauth]/route'

const prisma = new PrismaClient()

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const requester = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!requester?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params

  if (id === requester.id) {
    return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const permanentDeleteAt = new Date()
  permanentDeleteAt.setDate(permanentDeleteAt.getDate() + 7)

  await prisma.$transaction([
    prisma.deletedUser.create({
      data: {
        originalId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isAdmin: user.isAdmin,
        isCoach: user.isCoach,
        isAthlete: user.isAthlete,
        clubName: user.clubName,
        discipline: user.discipline,
        permanentDeleteAt,
      },
    }),
    prisma.user.delete({ where: { id } }),
  ])

  return NextResponse.json({ success: true })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const requester = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!requester?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const body = await request.json()
  const { isCoach, isAthlete, isAdmin } = body

  // Only the super admin can grant/revoke admin — and cannot remove their own admin
  if (isAdmin !== undefined && isAdmin !== requester.isAdmin && id === requester.id) {
    return NextResponse.json({ error: 'Cannot change your own admin status' }, { status: 400 })
  }
  if (isAdmin === true && !requester.isAdmin) {
    return NextResponse.json({ error: 'Only admins can grant admin' }, { status: 403 })
  }

  // Determine primary role for routing (coach takes priority)
  const willBeCoach = isCoach ?? false
  const willBeAthlete = isAthlete ?? false
  const primaryRole = willBeCoach ? 'coach' : willBeAthlete ? 'athlete' : 'athlete'

  const updateData: any = { role: primaryRole }
  if (isCoach !== undefined) updateData.isCoach = isCoach
  if (isAthlete !== undefined) updateData.isAthlete = isAthlete
  if (isAdmin !== undefined) updateData.isAdmin = isAdmin

  const user = await prisma.user.update({
    where: { id },
    data: updateData,
    select: { id: true, name: true, email: true, role: true, isCoach: true, isAthlete: true, isAdmin: true }
  })

  return NextResponse.json(user)
}
