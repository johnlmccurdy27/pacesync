import { auth } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import Sidebar from '@/app/components/Sidebar'
import LatestActivityCard from '@/app/components/LatestActivityCard'
import RotatingTagline from '@/app/components/RotatingTagline'
import Link from 'next/link'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function DashboardPage() {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  const user = await prisma.user.findUnique({ where: { email: session.user!.email! } })

  let athleteCount = 0
  let thisWeekCount = 0
  let completedCount = 0
  let assignedCount = 0

  if (user) {
    const now = new Date()

    const startOfWeek = new Date()
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
    startOfWeek.setHours(0, 0, 0, 0)
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(endOfWeek.getDate() + 7)

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const [athletes, twc, pastAssignments] = await Promise.all([
      prisma.groupMember.findMany({
        where: { group: { coachId: user.id } },
        select: { athleteId: true },
        distinct: ['athleteId'],
      }),
      prisma.workoutAssignment.count({
        where: {
          group: { coachId: user.id },
          scheduledFor: { gte: startOfWeek, lt: endOfWeek },
        },
      }),
      prisma.workoutAssignment.findMany({
        where: {
          group: { coachId: user.id },
          scheduledFor: { gte: thirtyDaysAgo, lt: now },
        },
        include: { _count: { select: { activities: true } } },
      }),
    ])

    athleteCount = athletes.length
    thisWeekCount = twc
    assignedCount = pastAssignments.length
    completedCount = pastAssignments.filter(a => a._count.activities > 0).length
  }

  const completionRate = assignedCount > 0 ? Math.round((completedCount / assignedCount) * 100) : null

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar userName={session.user?.name || session.user?.email || undefined} />
      
      <main className="flex-1 lg:ml-64 min-w-0">
        {/* Top Bar */}
        <div className="px-4 lg:px-8 py-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 hidden lg:block">Dashboard</h1>
          <Link
            href="/workouts/new"
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition"
          >
            <span>+</span>
            New Workout
          </Link>
        </div>

        <div className="p-4 lg:p-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {session.user?.name?.split(' ')[0]}! 👋
            </h2>
            <RotatingTagline className="text-gray-600" />
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-6 text-white shadow-lg">
              <div className="text-xs font-semibold uppercase tracking-wider mb-1 text-white/70">Total Athletes</div>
              <div className="text-4xl font-bold mb-2">{athleteCount}</div>
              <div className="text-sm opacity-75">{athleteCount === 1 ? '1 athlete across your groups' : athleteCount > 0 ? `${athleteCount} athletes across your groups` : 'No athletes yet'}</div>
            </div>

            <div className="bg-white rounded-xl p-6 border-2 border-indigo-200 hover:border-indigo-400 transition">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Completion Rate</div>
              <div className="flex items-end gap-2 mb-3">
                <div className="text-4xl font-bold text-gray-900">
                  {completionRate === null ? '—' : `${completionRate}%`}
                </div>
                {completionRate !== null && (
                  <div className={`mb-1 text-xs font-bold px-2 py-0.5 rounded-full ${
                    completionRate >= 70 ? 'bg-green-100 text-green-700' :
                    completionRate >= 40 ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {completionRate >= 70 ? 'On track' : completionRate >= 40 ? 'Needs attention' : 'Low'}
                  </div>
                )}
              </div>
              {completionRate !== null && (
                <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2">
                  <div
                    className={`h-1.5 rounded-full transition-all ${
                      completionRate >= 70 ? 'bg-green-500' :
                      completionRate >= 40 ? 'bg-amber-400' :
                      'bg-red-400'
                    }`}
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
              )}
              <div className="text-sm text-gray-500">
                {completionRate === null
                  ? 'No sessions due yet'
                  : `${completedCount} of ${assignedCount} sessions done (last 30 days)`}
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border-2 border-indigo-200 hover:border-indigo-400 transition">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">This Week</div>
              <div className="text-4xl font-bold text-gray-900 mb-2">{thisWeekCount}</div>
              <div className="text-sm text-gray-500">{thisWeekCount === 0 ? 'No sessions scheduled' : thisWeekCount === 1 ? '1 session scheduled' : `${thisWeekCount} sessions scheduled`}</div>
            </div>
          </div>

          {/* Latest Activity */}
          <div className="mb-8">
            <LatestActivityCard />
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 mb-8">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                href="/workouts/new"
                className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition"
              >
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <span className="text-indigo-600 text-xl">+</span>
                </div>
                <div className="text-left">
                  <div className="font-semibold text-gray-900">Create Workout</div>
                  <div className="text-sm text-gray-500">Build a new training session</div>
                </div>
              </Link>
              
              <Link
                href="/athletes"
                className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition"
              >
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <span className="text-indigo-600 text-xl">👥</span>
                </div>
                <div className="text-left">
                  <div className="font-semibold text-gray-900">Invite Athletes</div>
                  <div className="text-sm text-gray-500">Add athletes to your club</div>
                </div>
              </Link>
            </div>
          </div>

          {/* Getting Started */}
          {(athleteCount === 0 || thisWeekCount === 0) && (
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-6 border border-indigo-200">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Getting started</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${athleteCount > 0 ? 'bg-green-500' : 'bg-gray-200'}`}>
                    <span className="text-white text-xs">{athleteCount > 0 ? '✓' : '1'}</span>
                  </div>
                  <span className={`text-sm ${athleteCount > 0 ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                    Invite your first athlete
                  </span>
                  {athleteCount === 0 && (
                    <Link href="/athletes" className="text-xs text-indigo-600 hover:underline font-medium ml-auto">Do it now →</Link>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${thisWeekCount > 0 ? 'bg-green-500' : 'bg-gray-200'}`}>
                    <span className="text-white text-xs">{thisWeekCount > 0 ? '✓' : '2'}</span>
                  </div>
                  <span className={`text-sm ${thisWeekCount > 0 ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                    Schedule a session this week
                  </span>
                  {thisWeekCount === 0 && (
                    <Link href="/schedule" className="text-xs text-indigo-600 hover:underline font-medium ml-auto">Do it now →</Link>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}