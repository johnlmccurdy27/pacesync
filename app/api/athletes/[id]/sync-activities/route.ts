import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import { GarminConnect } from 'garmin-connect'
import { XMLParser } from 'fast-xml-parser'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

const prisma = new PrismaClient()

function parseGpxCoordinates(gpxXml: string): [number, number][] {
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' })
  const result = parser.parse(gpxXml)

  const trackpoints =
    result?.gpx?.trk?.trkseg?.trkpt ||
    result?.gpx?.trk?.[0]?.trkseg?.trkpt ||
    []

  const pts = Array.isArray(trackpoints) ? trackpoints : [trackpoints]
  return pts
    .filter((pt: any) => pt?.['@_lat'] && pt?.['@_lon'])
    .map((pt: any) => [parseFloat(pt['@_lat']), parseFloat(pt['@_lon'])] as [number, number])
    // Downsample to max 300 points to keep DB payload small
    .filter((_: any, i: number, arr: any[]) => arr.length <= 300 || i % Math.ceil(arr.length / 300) === 0)
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // Allow cron secret bypass OR authenticated coach/admin/self session
  const cronSecret = req.headers.get('x-cron-secret')
  const isCron = cronSecret && cronSecret === process.env.CRON_SECRET

  if (!isCron) {
    const session = await auth()
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const requester = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!requester) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const isSelf = requester.id === id
    if (!isSelf && !requester.isCoach && !requester.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const athlete = await prisma.user.findUnique({
    where: { id },
    include: { watchConnections: true }
  })
  if (!athlete) return NextResponse.json({ error: 'Athlete not found' }, { status: 404 })

  const garminConn = athlete.watchConnections.find(w => w.platform === 'garmin')
  if (!garminConn) {
    return NextResponse.json({ error: 'Athlete has no Garmin connection' }, { status: 400 })
  }

  const gc = new GarminConnect({ username: garminConn.accessToken, password: garminConn.refreshToken! })
  try {
    await gc.login()
  } catch (e: any) {
    const msg = e?.message || String(e)
    if (msg.includes('429') || msg.toLowerCase().includes('too many')) {
      return NextResponse.json({ error: 'Garmin is rate limiting requests. Please wait a few minutes and try again.' }, { status: 429 })
    }
    return NextResponse.json({ error: `Garmin login failed: ${msg}` }, { status: 502 })
  }

  // Fetch recent activities — get last 30 and filter to last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const rawActivities = await gc.getActivities(0, 30)
  const recent = rawActivities.filter(a => new Date(a.startTimeLocal) >= sevenDaysAgo)

  // Fetch workout assignments for this athlete's groups (for matching)
  const memberships = await prisma.groupMember.findMany({
    where: { athleteId: id },
    select: { groupId: true }
  })
  const groupIds = memberships.map(m => m.groupId)
  const assignments = await prisma.workoutAssignment.findMany({
    where: {
      groupId: { in: groupIds },
      scheduledFor: { gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) }
    },
    include: { workout: true }
  })

  const tmpDir = path.join(os.tmpdir(), `garmin-gpx-${id}`)
  fs.mkdirSync(tmpDir, { recursive: true })

  const saved: string[] = []

  for (const activity of recent) {
    const garminId = String(activity.activityId)

    // Skip if already synced for this user
    const existing = await prisma.activity.findUnique({ where: { userId_garminActivityId: { userId: id, garminActivityId: garminId } } })
    if (existing) continue

    // Download GPX for route data
    let coordinates: [number, number][] = []
    try {
      const gpxPath = path.join(tmpDir, `${garminId}.gpx`)
      await gc.downloadOriginalActivityData({ activityId: activity.activityId }, tmpDir, 'gpx')
      // garmin-connect saves as {activityId}.gpx
      const files = fs.readdirSync(tmpDir).filter(f => f.includes(garminId) && f.endsWith('.gpx'))
      if (files.length > 0) {
        const gpxXml = fs.readFileSync(path.join(tmpDir, files[0]), 'utf-8')
        coordinates = parseGpxCoordinates(gpxXml)
        fs.unlinkSync(path.join(tmpDir, files[0]))
      }
    } catch {
      // GPX unavailable for this activity — continue without route
    }

    // Match to a workout assignment:
    // 1. Activity started within ±12 hours of scheduledFor, OR
    // 2. Garmin activity name contains the workout name (case-insensitive)
    const activityTime = new Date(activity.startTimeLocal).getTime()
    const activityNameLower = activity.activityName.toLowerCase()
    const matchedAssignment = assignments.find(a => {
      const withinWindow = Math.abs(new Date(a.scheduledFor).getTime() - activityTime) <= 12 * 60 * 60 * 1000
      const nameMatch = activityNameLower.includes(a.workout.name.toLowerCase())
      return withinWindow || nameMatch
    })

    await prisma.activity.create({
      data: {
        userId: id,
        garminActivityId: garminId,
        name: activity.activityName,
        activityType: activity.activityType?.typeKey || 'unknown',
        startTime: new Date(activity.startTimeLocal),
        distance: activity.distance ?? null,
        duration: activity.duration ?? null,
        calories: activity.calories ?? null,
        avgHR: activity.averageHR ?? null,
        maxHR: activity.maxHR ?? null,
        elevationGain: activity.elevationGain ?? null,
        avgSpeed: activity.averageSpeed ?? null,
        coordinates: coordinates.length > 0 ? coordinates : undefined,
        assignmentId: matchedAssignment?.id ?? null,
      }
    })

    saved.push(garminId)
  }

  // Clean up tmp dir
  try { fs.rmdirSync(tmpDir) } catch {}

  return NextResponse.json({ synced: saved.length })
}
