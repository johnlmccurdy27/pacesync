'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Sidebar from '@/app/components/Sidebar'
import Link from 'next/link'

type Workout = {
  id: string
  name: string
  notes: string | null
}

type Group = {
  id: string
  name: string
}

type Assignment = {
  id: string
  scheduledFor: string
  deviceSyncId: string | null
  corosSyncId: string | null
  workout: Workout
  group: Group
}

type Step = {
  id: string
  type: string
  measure: string
  value: number
  unit: string
  zone: string | null
  position: number
}

type WorkoutDetail = {
  id: string
  name: string
  notes: string | null
  steps: Step[]
}

type StepGroup =
  | { kind: 'single'; step: Step }
  | { kind: 'repeat'; steps: Step[]; count: number }

function groupSteps(steps: Step[]): StepGroup[] {
  const groups: StepGroup[] = []
  let i = 0
  const stepsMatch = (a: Step, b: Step) =>
    a.type === b.type && a.value === b.value && a.unit === b.unit && a.measure === b.measure

  while (i < steps.length) {
    let found = false
    const maxWindow = Math.min(6, Math.floor((steps.length - i) / 2))
    for (let w = 2; w <= maxWindow; w++) {
      const pattern = steps.slice(i, i + w)
      let count = 1
      let j = i + w
      while (j + w <= steps.length) {
        const candidate = steps.slice(j, j + w)
        if (pattern.every((s, k) => stepsMatch(s, candidate[k]))) { count++; j += w } else break
      }
      if (count >= 2) { groups.push({ kind: 'repeat', steps: pattern, count }); i = j; found = true; break }
    }
    if (!found) { groups.push({ kind: 'single', step: steps[i] }); i++ }
  }
  return groups
}

export default function SchedulePage() {
  const { data: session } = useSession()
  const isAdmin = (session?.user as any)?.isAdmin === true

  const [currentDate, setCurrentDate] = useState(new Date())
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedWorkout, setSelectedWorkout] = useState('')
  const [selectedGroup, setSelectedGroup] = useState('')
  const [assigning, setAssigning] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)

  // Sync state
  const [syncing, setSyncing] = useState<string | null>(null)
  const [syncMessage, setSyncMessage] = useState<{ ok: boolean; text: string } | null>(null)

  // View state
  const [view, setView] = useState<'month' | 'day'>('month')
  const [dayViewDate, setDayViewDate] = useState(new Date())
  const [selectedWorkoutDetail, setSelectedWorkoutDetail] = useState<WorkoutDetail | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  useEffect(() => {
    loadData()
  }, [currentDate])

  const loadData = async () => {
    try {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

      const [assignmentsRes, workoutsRes, groupsRes] = await Promise.all([
        fetch(`/api/assignments?start=${startOfMonth.toISOString()}&end=${endOfMonth.toISOString()}`),
        fetch('/api/workouts'),
        fetch('/api/groups')
      ])

      if (assignmentsRes.ok) setAssignments(await assignmentsRes.json())
      if (workoutsRes.ok) setWorkouts(await workoutsRes.json())
      if (groupsRes.ok) setGroups(await groupsRes.json())
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAssignWorkout = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDate || !selectedWorkout || !selectedGroup) return
    setAssigning(true)
    try {
      const res = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workoutId: selectedWorkout, groupId: selectedGroup, scheduledFor: selectedDate.toISOString() })
      })
      if (res.ok) {
        setShowAssignModal(false)
        setSelectedWorkout('')
        setSelectedGroup('')
        loadData()
      }
    } catch (error) {
      console.error('Failed to assign workout:', error)
    } finally {
      setAssigning(false)
    }
  }

  const handleRemoveAssignment = async (assignmentId: string) => {
    setRemoving(assignmentId)
    try {
      const res = await fetch(`/api/assignments/${assignmentId}`, { method: 'DELETE' })
      if (res.ok) {
        setAssignments(prev => prev.filter(a => a.id !== assignmentId))
        if (selectedWorkoutDetail) setSelectedWorkoutDetail(null)
      }
    } catch (error) {
      console.error('Failed to remove assignment:', error)
    } finally {
      setRemoving(null)
    }
  }

  const loadWorkoutDetail = async (workoutId: string) => {
    setLoadingDetail(true)
    try {
      const res = await fetch(`/api/workouts/${workoutId}`)
      if (res.ok) setSelectedWorkoutDetail(await res.json())
    } catch (error) {
      console.error('Failed to load workout detail:', error)
    } finally {
      setLoadingDetail(false)
    }
  }

  const handleSync = async (platform: 'garmin' | 'coros', assignmentIds: string[], label: string) => {
    setSyncing(`${platform}-${label}`)
    setSyncMessage(null)
    const endpoint = platform === 'garmin' ? '/api/admin/sync-garmin' : '/api/admin/sync-coros'
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignmentIds }),
      })
      const data = await res.json()
      if (res.ok) {
        const count = data.totalSynced ?? data.synced ?? 0
        const platformLabel = platform === 'garmin' ? 'Garmin' : 'COROS'
        setSyncMessage({ ok: true, text: `Synced to ${count} athlete${count !== 1 ? 's' : ''} on ${platformLabel}${data.errors?.length ? ` (${data.errors.length} failed)` : ''}` })
        loadData()
      } else {
        setSyncMessage({ ok: false, text: data.error || 'Sync failed' })
      }
    } catch {
      setSyncMessage({ ok: false, text: 'Network error' })
    } finally {
      setSyncing(null)
    }
  }

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    const days = []
    const startingDayMon = (startingDayOfWeek + 6) % 7
    for (let i = 0; i < startingDayMon; i++) days.push(null)
    for (let day = 1; day <= daysInMonth; day++) days.push(new Date(year, month, day))
    return days
  }

  const getAssignmentsForDate = (date: Date) =>
    assignments.filter(a => new Date(a.scheduledFor).toDateString() === date.toDateString())

  const previousMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))

  const previousDay = () => {
    const d = new Date(dayViewDate)
    d.setDate(d.getDate() - 1)
    setDayViewDate(d)
    setSelectedWorkoutDetail(null)
  }

  const nextDay = () => {
    const d = new Date(dayViewDate)
    d.setDate(d.getDate() + 1)
    setDayViewDate(d)
    setSelectedWorkoutDetail(null)
  }

  const switchToDayView = (date: Date) => {
    setDayViewDate(date)
    setSelectedWorkoutDetail(null)
    setView('day')
  }

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })
  const days = getDaysInMonth()
  const dayAssignments = getAssignmentsForDate(dayViewDate)

  return (
    <>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />

        <main className="flex-1 lg:ml-64 w-full">
          {/* Top Bar */}
          <div className="px-4 lg:px-8 py-6 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Training Schedule</h1>
            <div className="flex items-center gap-3">
              {/* View toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setView('month')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${view === 'month' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Month
                </button>
                <button
                  onClick={() => { setView('day'); setSelectedWorkoutDetail(null) }}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${view === 'day' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Day
                </button>
              </div>
              <Link
                href="/workouts/new"
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition"
              >
                <span>+</span>
                New Workout
              </Link>
            </div>
          </div>

          <div className="p-4 lg:p-8 lg:pt-2">

            {/* Sync feedback */}
            {syncMessage && (
              <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium ${syncMessage.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {syncMessage.text}
              </div>
            )}

            {/* ── MONTH VIEW ── */}
            {view === 'month' && (
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">{monthName}</h2>
                  <div className="flex gap-2">
                    <button onClick={previousMonth} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">← Previous</button>
                    <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">Today</button>
                    <button onClick={nextMonth} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">Next →</button>
                    {isAdmin && assignments.length > 0 && (
                      <>
                        <button
                          onClick={() => handleSync('garmin', assignments.map(a => a.id), 'month')}
                          disabled={!!syncing}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition disabled:opacity-50 text-sm"
                        >
                          {syncing === 'garmin-month' ? 'Syncing…' : 'Sync Month → Garmin'}
                        </button>
                        <button
                          onClick={() => handleSync('coros', assignments.map(a => a.id), 'month')}
                          disabled={!!syncing}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition disabled:opacity-50 text-sm"
                        >
                          {syncing === 'coros-month' ? 'Syncing…' : 'Sync Month → COROS'}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-6 text-sm mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-indigo-100 border border-indigo-500 rounded"></div>
                    <span className="text-gray-600">Today</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-indigo-100 rounded"></div>
                    <span className="text-gray-600">Workout assigned</span>
                  </div>
                  <div className="text-gray-500">Click any date to assign a workout</div>
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                    <div key={day} className="text-center font-semibold text-gray-700 py-2">{day}</div>
                  ))}
                  {days.map((date, index) => {
                    if (!date) return <div key={`empty-${index}`} className="aspect-square" />
                    const dayAssignments = getAssignmentsForDate(date)
                    const isToday = date.toDateString() === new Date().toDateString()
                    const isPast = date < new Date() && !isToday
                    return (
                      <div
                        key={date.toISOString()}
                        className={`aspect-square border rounded-lg p-2 cursor-pointer transition ${isToday ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'} ${isPast ? 'opacity-60' : ''}`}
                      >
                        <div className="flex flex-col h-full">
                          <div className="flex items-center justify-between mb-1">
                            <span
                              className={`text-sm font-semibold ${isToday ? 'text-indigo-600' : 'text-gray-900'}`}
                              onClick={() => { setSelectedDate(date); setShowAssignModal(true) }}
                            >
                              {date.getDate()}
                            </span>
                            {dayAssignments.length > 0 && (
                              <button
                                onClick={() => switchToDayView(date)}
                                className="text-xs text-indigo-500 hover:text-indigo-700 font-medium leading-none"
                                title="Day view"
                              >
                                ›
                              </button>
                            )}
                          </div>
                          <div
                            className="flex-1 overflow-y-auto space-y-1"
                            onClick={() => { setSelectedDate(date); setShowAssignModal(true) }}
                          >
                            {dayAssignments.map(assignment => (
                              <div
                                key={assignment.id}
                                className="text-xs bg-indigo-100 text-indigo-700 rounded px-1.5 py-1 truncate"
                                title={`${assignment.workout.name} - ${assignment.group.name}`}
                              >
                                {assignment.workout.name}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── DAY VIEW ── */}
            {view === 'day' && (
              <div className="flex gap-6 items-start">

                {/* Left panel — day + assignments */}
                <div className="w-80 flex-shrink-0 space-y-4">
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    {/* Day navigation */}
                    <div className="flex items-center justify-between mb-5 gap-3">
                      <button onClick={previousDay} className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 transition text-gray-400 hover:text-gray-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                      </button>
                      <div className="text-center flex-1">
                        <div className="text-xs font-semibold uppercase tracking-widest text-yellow-600 mb-0.5">
                          {dayViewDate.toLocaleDateString('en-GB', { weekday: 'short' })}
                        </div>
                        <div className="text-6xl font-bold text-gray-900 leading-none">
                          {dayViewDate.getDate()}
                        </div>
                        <div className="text-xs text-gray-400 mt-1.5 tracking-wide">
                          {dayViewDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
                        </div>
                      </div>
                      <button onClick={nextDay} className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 transition text-gray-400 hover:text-gray-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </button>
                    </div>

                    <button
                      onClick={() => { setSelectedDate(dayViewDate); setShowAssignModal(true) }}
                      className="w-full py-2 border-2 border-dashed border-yellow-400 text-yellow-600 rounded-lg text-sm font-medium hover:bg-yellow-50 transition mb-4"
                    >
                      + Assign workout
                    </button>

                    {dayAssignments.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-4">No workouts scheduled</p>
                    ) : (
                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Scheduled</div>
                        {dayAssignments.map(a => (
                          <div
                            key={a.id}
                            onClick={() => loadWorkoutDetail(a.workout.id)}
                            className={`p-3 rounded-lg border cursor-pointer transition ${selectedWorkoutDetail?.id === a.workout.id ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'}`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-sm font-semibold text-gray-900">{a.workout.name}</div>
                                <div className="text-xs text-gray-500">{a.group.name}</div>
                              </div>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleRemoveAssignment(a.id) }}
                                disabled={removing === a.id}
                                className="w-7 h-7 flex items-center justify-center rounded-full bg-red-100 hover:bg-red-200 text-red-500 transition disabled:opacity-40 flex-shrink-0 ml-2"
                                title="Remove"
                              >
                                {removing === a.id
                                  ? <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                                  : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                }
                              </button>
                            </div>
                            {isAdmin && (
                              <div className="mt-2 flex flex-wrap gap-2" onClick={e => e.stopPropagation()}>
                                {a.deviceSyncId ? (
                                  <span className="text-xs text-green-600 font-medium">✓ Garmin</span>
                                ) : (
                                  <button
                                    onClick={() => handleSync('garmin', [a.id], a.id)}
                                    disabled={!!syncing}
                                    className="text-xs font-semibold text-green-600 hover:text-green-800 transition disabled:opacity-50"
                                  >
                                    {syncing === `garmin-${a.id}` ? 'Syncing…' : '↑ Garmin'}
                                  </button>
                                )}
                                {a.corosSyncId ? (
                                  <span className="text-xs text-blue-600 font-medium">✓ COROS</span>
                                ) : (
                                  <button
                                    onClick={() => handleSync('coros', [a.id], a.id)}
                                    disabled={!!syncing}
                                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition disabled:opacity-50"
                                  >
                                    {syncing === `coros-${a.id}` ? 'Syncing…' : '↑ COROS'}
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right panel — workout detail */}
                <div className="flex-1">
                  {loadingDetail && (
                    <div className="bg-white rounded-xl border border-gray-200 p-8 flex items-center justify-center">
                      <div className="text-gray-400">Loading workout...</div>
                    </div>
                  )}

                  {!loadingDetail && !selectedWorkoutDetail && (
                    <div className="bg-white rounded-xl border border-gray-200 p-12 flex flex-col items-center justify-center text-center">
                      <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <p className="text-gray-500 font-medium">Select a workout on the left to view its details</p>
                    </div>
                  )}

                  {!loadingDetail && selectedWorkoutDetail && (
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <h2 className="text-xl font-bold text-gray-900">{selectedWorkoutDetail.name}</h2>
                          {selectedWorkoutDetail.notes && (
                            <p className="text-sm text-gray-500 mt-1">{selectedWorkoutDetail.notes}</p>
                          )}
                        </div>
                        <Link
                          href={`/workouts/${selectedWorkoutDetail.id}`}
                          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex-shrink-0 ml-4"
                        >
                          Full view →
                        </Link>
                      </div>

                      <div className="space-y-3">
                        {groupSteps(selectedWorkoutDetail.steps).map((group, groupIndex) => {
                          if (group.kind === 'single') {
                            return (
                              <div key={groupIndex} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                                <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-semibold text-sm">
                                  {groupIndex + 1}
                                </div>
                                <div className="flex-1 grid grid-cols-4 gap-3">
                                  <div><div className="text-xs text-gray-500 mb-0.5">Type</div><div className="font-medium text-gray-900 capitalize text-sm">{group.step.type}</div></div>
                                  <div><div className="text-xs text-gray-500 mb-0.5">Duration</div><div className="font-medium text-gray-900 text-sm">{group.step.value} {group.step.unit}</div></div>
                                  <div><div className="text-xs text-gray-500 mb-0.5">Measure</div><div className="font-medium text-gray-900 capitalize text-sm">{group.step.measure}</div></div>
                                  <div><div className="text-xs text-gray-500 mb-0.5">Intensity</div><div className="font-medium text-gray-900 text-sm">{group.step.zone || 'N/A'}</div></div>
                                </div>
                              </div>
                            )
                          } else {
                            return (
                              <div key={groupIndex} className="border border-yellow-400 rounded-lg overflow-hidden">
                                <div className="bg-yellow-50 px-4 py-2 flex items-center gap-2 border-b border-yellow-300">
                                  <span className="font-bold text-yellow-600">{group.count} ×</span>
                                  <span className="text-sm text-yellow-600 font-medium">Repeat Block</span>
                                </div>
                                {group.steps.map((step, stepIndex) => (
                                  <div key={stepIndex} className={`flex items-center gap-4 px-4 py-3 ${stepIndex < group.steps.length - 1 ? 'border-b border-yellow-200' : ''}`}>
                                    <div className="flex-shrink-0 w-6 h-6 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center text-xs font-semibold">{stepIndex + 1}</div>
                                    <div className="flex-1 grid grid-cols-4 gap-3">
                                      <div><div className="text-xs text-gray-500 mb-0.5">Type</div><div className="font-medium text-gray-900 capitalize text-sm">{step.type}</div></div>
                                      <div><div className="text-xs text-gray-500 mb-0.5">Duration</div><div className="font-medium text-gray-900 text-sm">{step.value} {step.unit}</div></div>
                                      <div><div className="text-xs text-gray-500 mb-0.5">Measure</div><div className="font-medium text-gray-900 capitalize text-sm">{step.measure}</div></div>
                                      <div><div className="text-xs text-gray-500 mb-0.5">Intensity</div><div className="font-medium text-gray-900 text-sm">{step.zone || 'N/A'}</div></div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )
                          }
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Assign Workout Modal */}
      {showAssignModal && selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="flex justify-between items-start mb-1">
              <h3 className="text-xl font-bold text-gray-900">
                {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </h3>
              <button
                onClick={() => { setShowAssignModal(false); setSelectedWorkout(''); setSelectedGroup('') }}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none ml-4"
              >
                ×
              </button>
            </div>

            {/* Existing assignments */}
            {(() => {
              const dayAssignments = getAssignmentsForDate(selectedDate)
              if (dayAssignments.length === 0) return null
              return (
                <div className="mb-5">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Scheduled</div>
                  <div className="space-y-2">
                    {dayAssignments.map(a => (
                      <div key={a.id} className="flex items-center justify-between bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2">
                        <div>
                          <div className="text-sm font-medium text-indigo-800">{a.workout.name}</div>
                          <div className="text-xs text-indigo-500">{a.group.name}</div>
                        </div>
                        <button
                          onClick={() => handleRemoveAssignment(a.id)}
                          disabled={removing === a.id}
                          className="ml-3 w-7 h-7 flex items-center justify-center rounded-full bg-red-100 hover:bg-red-200 text-red-500 transition disabled:opacity-40 flex-shrink-0"
                          title="Remove"
                        >
                          {removing === a.id
                            ? <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                            : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          }
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}

            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Add workout</div>
            <form onSubmit={handleAssignWorkout}>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Workout *</label>
                  <select
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    value={selectedWorkout}
                    onChange={(e) => setSelectedWorkout(e.target.value)}
                  >
                    <option value="">Choose a workout...</option>
                    {workouts.map(workout => (
                      <option key={workout.id} value={workout.id}>{workout.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assign to Group *</label>
                  <select
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    value={selectedGroup}
                    onChange={(e) => setSelectedGroup(e.target.value)}
                  >
                    <option value="">Choose a group...</option>
                    {groups.map(group => (
                      <option key={group.id} value={group.id}>{group.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setShowAssignModal(false); setSelectedWorkout(''); setSelectedGroup('') }}
                  disabled={assigning}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assigning}
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition disabled:opacity-50"
                >
                  {assigning ? 'Assigning...' : 'Assign Workout'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
