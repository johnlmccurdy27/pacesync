import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  // Verify this is called by Vercel Cron (or manually with the secret)
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Find all athletes with a Garmin connection
  const connections = await prisma.watchConnection.findMany({
    where: { platform: 'garmin' },
    select: { userId: true }
  })

  const results: { userId: string; status: string }[] = []

  for (const { userId } of connections) {
    try {
      const res = await fetch(
        `${process.env.NEXTAUTH_URL}/api/athletes/${userId}/sync-activities`,
        {
          method: 'POST',
          headers: {
            'x-cron-secret': process.env.CRON_SECRET!
          }
        }
      )
      const data = await res.json()
      results.push({ userId, status: res.ok ? `synced ${data.synced}` : data.error })
    } catch (e: any) {
      results.push({ userId, status: `error: ${e.message}` })
    }
  }

  return NextResponse.json({ ran: results.length, results })
}
