import { auth } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import { PrismaClient } from '@prisma/client'
import Sidebar from '@/app/components/Sidebar'
import FitnessChart from '@/app/components/FitnessChart'
import LatestActivityCard from '@/app/components/LatestActivityCard'
import Image from 'next/image'
import Link from 'next/link'

const prisma = new PrismaClient()

export default async function AthleteDashboardPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { email: session.user!.email! },
    include: {
      athleteGroups: { include: { group: { include: { coach: { select: { name: true, bio: true, clubName: true, profilePicture: true } } } } } },
      watchConnections: true
    }
  })

  if (!user || user.role !== 'athlete') redirect('/dashboard-redirect')

  // Next scheduled workout — find next assignment for any group the athlete is in
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

      <main className="flex-1 lg:ml-64 w-full">
        <div className="px-4 lg:px-8 py-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">My Dashboard</h1>
          <Link href="/athlete/profile" className="text-sm text-indigo-600 hover:underline font-medium">View Profile</Link>
        </div>

        <div className="p-4 lg:p-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-1">
              Welcome back, {user.name?.split(' ')[0] || 'Athlete'}!
            </h2>
            <p className="text-gray-500 text-sm">Here's your training overview</p>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-6 text-white shadow-lg">
              <div className="text-sm font-medium mb-1 opacity-90">My Groups</div>
              <div className="text-4xl font-bold mb-1">{user.athleteGroups.length}</div>
              <div className="text-sm opacity-75">{user.athleteGroups.length === 0 ? 'No groups yet' : 'Training groups'}</div>
            </div>
            <div className="bg-white rounded-xl p-6 border-2 border-indigo-200">
              <div className="text-sm font-medium text-indigo-600 mb-1">Next Session</div>
              <div className="text-lg font-bold text-gray-900 mb-1">
                {nextAssignment ? new Date(nextAssignment.scheduledFor).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) : '—'}
              </div>
              <div className="text-sm text-gray-500">{nextAssignment ? nextAssignment.workout.name : 'No sessions scheduled'}</div>
            </div>
            <div className="bg-white rounded-xl p-6 border-2 border-indigo-200">
              <div className="text-sm font-medium text-indigo-600 mb-1">Fitness Score</div>
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
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Next Workout</h3>
                <div className="mb-4">
                  <h4 className="font-bold text-gray-900 text-xl">{nextAssignment.workout.name}</h4>
                  <p className="text-indigo-600 text-sm font-medium mt-1">
                    {new Date(nextAssignment.scheduledFor).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })} — {nextAssignment.group.name}
                  </p>
                  {nextAssignment.workout.notes && <p className="text-gray-500 text-sm mt-2">{nextAssignment.workout.notes}</p>}
                </div>
                <div className="border-t border-gray-100 pt-4 flex gap-6">
                  {/* Steps list */}
                  <div className="flex-1 space-y-2">
                    {steps.slice(0, 5).map((step, i) => (
                      <div key={step.id} className="flex items-center gap-3 text-sm">
                        <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</span>
                        <span className="capitalize font-medium text-gray-700">{step.type}</span>
                        <span className="text-gray-500">{step.value} {step.unit}</span>
                        {step.zone && <span className="ml-auto text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{step.zone}</span>}
                      </div>
                    ))}
                    {steps.length > 5 && (
                      <p className="text-xs text-gray-400 pl-8">+{steps.length - 5} more steps</p>
                    )}
                  </div>
                  {/* Bar chart */}
                  <div className="w-48 flex-shrink-0 flex gap-0.5 h-24 items-end">
                    {normalized.map(({ step, nv }) => (
                      <div
                        key={step.id}
                        className="rounded-t flex-1"
                        style={{
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Fitness Chart */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Fitness Score</h3>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">Last 12 weeks</span>
              </div>
              <FitnessChart />
              <p className="text-xs text-gray-400 mt-3 text-center">* Fitness data will update automatically once your watch is connected</p>
            </div>

            {/* My Groups */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">My Training Groups</h3>
              {user.athleteGroups.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-5xl mb-3">👥</div>
                  <p className="text-gray-500 text-sm">You're not in any training groups yet</p>
                  <p className="text-xs text-gray-400 mt-1">Ask your coach to invite you</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {user.athleteGroups.map((membership) => (
                    <div key={membership.id} className="border border-gray-100 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900">{membership.group.name}</h4>
                      {membership.group.description && <p className="text-sm text-gray-500 mt-0.5">{membership.group.description}</p>}
                      {membership.group.coach && (
                        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-3">
                          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                            {membership.group.coach.profilePicture ? (
                              <img src={membership.group.coach.profilePicture} className="w-full h-full rounded-full object-cover" alt="" />
                            ) : (
                              <span className="text-xs font-bold text-indigo-600">{membership.group.coach.name?.charAt(0) || 'C'}</span>
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-700">{membership.group.coach.name || 'Your Coach'}</p>
                            {membership.group.coach.bio && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{membership.group.coach.bio}</p>}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Connected Watch */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Connected Device</h3>
            {user.watchConnections.length > 0 ? (
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">⌚</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 capitalize">{user.watchConnections[0].platform}</p>
                  <p className="text-sm text-green-600 font-medium">Connected</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <p className="text-gray-500 text-sm">Connect your device to sync workouts directly to your wrist.</p>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="flex flex-col items-center gap-1 opacity-50 cursor-not-allowed">
                    <div className="w-16 h-10 relative">
                      <Image src="/Garmin logo.svg" alt="Garmin" fill className="object-contain" />
                    </div>
                    <span className="text-xs text-gray-400">Coming soon</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 opacity-50 cursor-not-allowed">
                    <div className="w-16 h-10 relative">
                      <Image src="/Coros logo.png" alt="COROS" fill className="object-contain" />
                    </div>
                    <span className="text-xs text-gray-400">Coming soon</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
