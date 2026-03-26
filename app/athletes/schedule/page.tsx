import { auth } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import { PrismaClient } from '@prisma/client'
import Sidebar from '@/app/components/Sidebar'
import Link from 'next/link'

const prisma = new PrismaClient()

type Step = {
  id: string
  type: string
  measure: string
  value: number
  unit: string
  zone: string | null
  position: number
}

type StepGroup =
  | { kind: 'single'; step: Step }
  | { kind: 'repeat'; steps: Step[]; count: number }

function groupSteps(steps: Step[]): StepGroup[] {
  const result: StepGroup[] = []
  let i = 0
  while (i < steps.length) {
    let found = false
    for (let size = Math.min(6, Math.floor((steps.length - i) / 2)); size >= 2; size--) {
      const window = steps.slice(i, i + size)
      let count = 1
      while (
        i + size * (count + 1) <= steps.length &&
        steps.slice(i + size * count, i + size * (count + 1)).every((s, j) =>
          s.type === window[j].type && s.value === window[j].value &&
          s.unit === window[j].unit && s.measure === window[j].measure
        )
      ) count++
      if (count >= 2) {
        result.push({ kind: 'repeat', steps: window, count })
        i += size * count
        found = true
        break
      }
    }
    if (!found) { result.push({ kind: 'single', step: steps[i] }); i++ }
  }
  return result
}

export default async function AthleteSchedulePage() {
  const session = await auth()
  if (!session) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { email: session.user!.email! },
    include: { athleteGroups: { include: { group: true } } }
  })

  if (!user || user.role !== 'athlete') redirect('/dashboard-redirect')

  const groupIds = user.athleteGroups.map(m => m.groupId)

  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  const assignments = groupIds.length > 0
    ? await prisma.workoutAssignment.findMany({
        where: { groupId: { in: groupIds }, scheduledFor: { gte: startOfToday } },
        orderBy: { scheduledFor: 'asc' },
        include: {
          workout: { include: { steps: { orderBy: { position: 'asc' } } } },
          group: true
        }
      })
    : []

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  function dayLabel(date: Date) {
    const d = new Date(date)
    d.setHours(0, 0, 0, 0)
    if (d.getTime() === today.getTime()) return 'Today'
    if (d.getTime() === tomorrow.getTime()) return 'Tomorrow'
    return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
  }

  function isToday(date: Date) {
    const d = new Date(date)
    d.setHours(0, 0, 0, 0)
    return d.getTime() === today.getTime()
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar userName={user.name || user.email} />

      <main className="flex-1 lg:ml-64 w-full">
        <div className="px-4 lg:px-8 py-6">
          <h1 className="text-2xl font-bold text-gray-900">My Schedule</h1>
        </div>

        <div className="px-4 lg:px-8 pb-8 max-w-2xl space-y-4">
          {assignments.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <div className="text-4xl mb-3">📅</div>
              <p className="text-gray-500">No upcoming workouts scheduled</p>
              <p className="text-xs text-gray-400 mt-1">Your coach will assign sessions here</p>
            </div>
          ) : assignments.map(assignment => {
            const groups = groupSteps(assignment.workout.steps)
            let stepCounter = 0

            return (
              <div
                key={assignment.id}
                className={`bg-white rounded-xl border overflow-hidden ${isToday(assignment.scheduledFor) ? 'border-indigo-300 shadow-md' : 'border-gray-200'}`}
              >
                {/* Header */}
                <div className={`px-5 py-3 flex items-center justify-between ${isToday(assignment.scheduledFor) ? 'bg-indigo-600' : 'bg-gray-50 border-b border-gray-100'}`}>
                  <div>
                    <div className={`text-xs font-semibold uppercase tracking-wider ${isToday(assignment.scheduledFor) ? 'text-indigo-200' : 'text-gray-400'}`}>
                      {dayLabel(assignment.scheduledFor)}
                    </div>
                    <div className={`font-bold text-lg leading-tight ${isToday(assignment.scheduledFor) ? 'text-white' : 'text-gray-900'}`}>
                      {assignment.workout.name}
                    </div>
                  </div>
                  <div className={`text-xs font-medium px-2.5 py-1 rounded-full ${isToday(assignment.scheduledFor) ? 'bg-indigo-500 text-indigo-100' : 'bg-gray-100 text-gray-500'}`}>
                    {assignment.group.name}
                  </div>
                </div>

                {/* Steps */}
                <div className="p-4 space-y-2">
                  {assignment.workout.notes && (
                    <p className="text-sm text-gray-500 mb-3">{assignment.workout.notes}</p>
                  )}
                  {groups.map((group, gi) => {
                    if (group.kind === 'single') {
                      stepCounter++
                      const n = stepCounter
                      return (
                        <div key={gi} className="flex items-center gap-3 text-sm">
                          <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold flex-shrink-0">{n}</span>
                          <span className="capitalize font-medium text-gray-700">{group.step.type}</span>
                          <span className="text-gray-500">{group.step.value} {group.step.unit}</span>
                          {group.step.zone && <span className="ml-auto text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{group.step.zone}</span>}
                        </div>
                      )
                    } else {
                      stepCounter++
                      const n = stepCounter
                      return (
                        <div key={gi} className="border border-yellow-300 rounded-lg overflow-hidden">
                          <div className="bg-yellow-50 px-3 py-1.5 flex items-center gap-2 border-b border-yellow-200">
                            <span className="w-6 h-6 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center text-xs font-bold flex-shrink-0">{n}</span>
                            <span className="text-sm font-bold text-yellow-600">{group.count} ×</span>
                            <span className="text-xs text-yellow-600 font-medium">Repeat Block</span>
                          </div>
                          <div className="p-3 space-y-1.5">
                            {group.steps.map((step, si) => (
                              <div key={si} className="flex items-center gap-3 text-sm pl-2">
                                <span className="capitalize font-medium text-gray-700">{step.type}</span>
                                <span className="text-gray-500">{step.value} {step.unit}</span>
                                {step.zone && <span className="ml-auto text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{step.zone}</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    }
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}
