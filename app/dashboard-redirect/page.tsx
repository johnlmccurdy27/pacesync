import { auth } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function DashboardRedirect() {
  const session = await auth()
  
  if (!session?.user?.email) {
    redirect('/login')
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  })

  if (!user) {
    redirect('/login')
  }

  // Route based on role
  if (user.role === 'coach') {
    redirect('/dashboard')
  } else if (user.role === 'athlete') {
    redirect('/athletes/dashboard')
  } else {
    redirect('/login')
  }
}