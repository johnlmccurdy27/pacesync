import { auth } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import { PrismaClient } from '@prisma/client'
import Sidebar from '@/app/components/Sidebar'
import LatestActivityCard from '@/app/components/LatestActivityCard'
import RotatingTagline from '@/app/components/RotatingTagline'
import Link from 'next/link'

const prisma = new PrismaClient()

export default async function AthleteDashboardPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { email: session.user!.email! },
    include: {
      athleteGroups: { include: { group: { select: { id: true } } } },
      watchConnections: true
    }
  })

  if (!user || user.role !== 'athlete') redirect('/dashboard-redirect')

  const groupIds = user.athleteGroups.map(m => m.group.id)
  const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0)
  const nextAssignment = groupIds.length > 0 ? await prisma.workoutAssignment.findFirst({
    where: { groupId: { in: groupIds }, scheduledFor: { gte: startOfToday } },
    orderBy: { scheduledFor: 'asc' },
    include: { workout: { include: { steps: { orderBy: { position: 'asc' } } } }, group: true }
  }) : null

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar userName={user.name || user.email} />

      <main className="flex-1 lg:ml-64 min-w-0">
        <div className="px-4 lg:px-8 py-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 hidden lg:block">My Dashboard</h1>
          <Link href="/athlete/profile" className="text-sm text-indigo-600 hover:underline font-medium hidden lg:block">View Profile</Link>
        </div>

        <div className="p-4 lg:p-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-1">
              Welcome back, {user.name?.split(' ')[0] || 'Athlete'}!
            </h2>
            <RotatingTagline className="text-gray-500 text-sm" />
          </div>

          {/* Device connection prompt */}
          {user.watchConnections.length === 0 && (
            <div className="mb-8 border border-amber-200 bg-amber-50 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-1">
                <p className="font-semibold text-amber-900 text-sm">Connect your device to unlock workout syncing</p>
                <p className="text-amber-700 text-xs mt-0.5">Add your Garmin or COROS credentials so workouts sync directly to your watch.</p>
              </div>
              <Link
                href="/athlete/profile"
                className="flex-shrink-0 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
              >
                Connect Device →
              </Link>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            {/* Next Session card */}
            <div className="bg-white rounded-xl p-6 border-2 border-indigo-200 flex flex-col sm:flex-row items-center sm:items-start gap-4">
              {nextAssignment ? (() => {
                const d = new Date(nextAssignment.scheduledFor)
                const weekday = d.toLocaleDateString('en-GB', { weekday: 'short' }).toUpperCase()
                const day = d.getDate()
                const month = d.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase()
                return (
                  <>
                    <div className="flex flex-col justify-center text-center sm:text-left min-w-0 flex-1">
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Next Session</div>
                      <div className="text-sm font-bold text-gray-900 leading-snug">{nextAssignment.workout.name}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{nextAssignment.group.name}</div>
                    </div>
                    <div className="flex flex-col items-center justify-center bg-yellow-400 rounded-xl px-4 py-3 min-w-[64px] flex-shrink-0">
                      <span className="text-xs font-bold text-yellow-800 tracking-widest">{weekday}</span>
                      <span className="text-4xl font-bold text-white leading-none">{day}</span>
                      <span className="text-xs font-semibold text-yellow-800 tracking-widest mt-0.5">{month}</span>
                    </div>
                  </>
                )
              })() : (
                <div className="flex flex-col items-center sm:items-start justify-center w-full gap-1">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Next Session</div>
                  <div className="text-sm text-gray-400">No sessions scheduled</div>
                </div>
              )}
            </div>

            {/* Fitness Score card */}
            <div className="bg-white rounded-xl p-6 border-2 border-indigo-200">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Fitness Score</div>
              <div className="text-4xl font-bold text-gray-900 mb-1">72</div>
              <div className="text-sm flex items-center gap-1">
                <span className="text-green-500 font-bold">↑</span>
                <span className="text-gray-500">3 pts this week</span>
              </div>
            </div>
          </div>

          {/* Next Workout */}
          {nextAssignment && (() => {
            const steps = nextAssignment.workout.steps

            const getStepColor = (step: typeof steps[0]) => {
              const type = step.type.toLowerCase()
              if (type === 'warmup' || type === 'cooldown') return '#c7d2fe'
              switch ((step.zone || 'easy').toLowerCase()) {
                case 'easy': return '#818cf8'
                case 'moderate': return '#6366f1'
                case 'tempo': return '#3730a3'
                case 'threshold': return '#312e81'
                case 'vo2max': return '#1e1b4b'
                case 'sprint': return '#0f0d2e'
                default: return '#6366f1'
              }
            }

            const normalized = steps.map(step => {
              if (step.measure === 'distance') {
                const val = step.unit.toLowerCase() === 'km' ? step.value : step.unit.toLowerCase() === 'mi' ? step.value * 1.60934 : step.value / 1000
                return { step, nv: val }
              } else {
                const val = step.unit.toLowerCase() === 'min' ? step.value : step.unit.toLowerCase() === 'hr' ? step.value * 60 : step.value / 60
                return { step, nv: val * 0.5 }
              }
            })
            const totalNv = normalized.reduce((s, n) => s + n.nv, 0)
            const maxNv = Math.max(...normalized.map(n => n.nv))

            return (
              <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Next Workout</h3>
                <h4 className="font-bold text-gray-900 text-xl mb-1">{nextAssignment.workout.name}</h4>
                <p className="text-indigo-600 text-sm font-medium mb-2">
                  {new Date(nextAssignment.scheduledFor).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })} — {nextAssignment.group.name}
                </p>
                {nextAssignment.workout.notes && (
                  <p className="text-gray-500 text-sm mb-4">{nextAssignment.workout.notes}</p>
                )}
                <div className="border-t border-gray-100 pt-4">
                  <div className="flex h-20 items-end w-full overflow-hidden gap-px">
                    {normalized.map(({ step, nv }) => (
                      <div
                        key={step.id}
                        className="rounded-t"
                        style={{
                          flex: `${nv} 1 0%`,
                          height: `${(nv / maxNv) * 100}%`,
                          backgroundColor: getStepColor(step),
                          minHeight: '15%'
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )
          })()}

          {/* Latest Activity */}
          <div className="mb-6">
            <LatestActivityCard />
          </div>
        </div>
      </main>
    </div>
  )
}
