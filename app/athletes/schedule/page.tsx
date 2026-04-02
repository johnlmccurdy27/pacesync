'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Sidebar from '@/app/components/Sidebar'

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
  repeatCount: number | null
  repeatGroup: string | null
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

type WeatherDay = { date: string; code: number; maxTemp: number }

function weatherEmoji(code: number): string {
  if (code === 0) return '☀️'
  if (code <= 2) return '⛅'
  if (code <= 3) return '☁️'
  if (code === 45 || code === 48) return '🌫️'
  if (code <= 67) return '🌧️'
  if (code <= 77) return '❄️'
  if (code <= 82) return '🌦️'
  if (code <= 86) return '🌨️'
  return '⛈️'
}

function groupSteps(steps: Step[]): StepGroup[] {
  const groups: StepGroup[] = []

  // New format: use repeatGroup field if present
  if (steps.some(s => s.repeatGroup != null)) {
    let i = 0
    while (i < steps.length) {
      const step = steps[i]
      if (!step.repeatGroup) {
        groups.push({ kind: 'single', step })
        i++
      } else {
        const groupId = step.repeatGroup
        const count = step.repeatCount ?? 1
        const groupStepsList: Step[] = []
        while (i < steps.length && steps[i].repeatGroup === groupId) {
          groupStepsList.push(steps[i])
          i++
        }
        groups.push({ kind: 'repeat', steps: groupStepsList, count })
      }
    }
    return groups
  }

  // Legacy fallback: heuristic pattern matching
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

export default function AthleteSchedulePage() {
  const { data: session } = useSession()

  const [currentDate, setCurrentDate] = useState(new Date())
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'month' | 'day'>('month')
  const [dayViewDate, setDayViewDate] = useState(new Date())
  const [selectedWorkoutDetail, setSelectedWorkoutDetail] = useState<WorkoutDetail | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [weather, setWeather] = useState<Record<string, WeatherDay>>({})

  // Default to day view on mobile
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setView('day')
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [currentDate])

  // Fetch weather via Open-Meteo (no API key needed)
  useEffect(() => {
    const fetchWeather = (lat: number, lon: number) => {
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weathercode,temperature_2m_max&timezone=auto&forecast_days=16`)
        .then(r => r.json())
        .then(data => {
          const map: Record<string, WeatherDay> = {}
          data.daily.time.forEach((date: string, i: number) => {
            map[date] = { date, code: data.daily.weathercode[i], maxTemp: Math.round(data.daily.temperature_2m_max[i]) }
          })
          setWeather(map)
        })
        .catch(() => {})
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => fetchWeather(coords.latitude, coords.longitude),
        () => fetchWeather(51.5, -0.12) // fallback: London
      )
    } else {
      fetchWeather(51.5, -0.12)
    }
  }, [])

  // Auto-select first workout when day changes or assignments load
  useEffect(() => {
    const dayA = assignments.filter(a => new Date(a.scheduledFor).toDateString() === dayViewDate.toDateString())
    if (dayA.length > 0) {
      fetchWorkoutDetail(dayA[0].workout.id)
    } else {
      setSelectedWorkoutDetail(null)
    }
  }, [dayViewDate, assignments])

  const loadData = async () => {
    setLoading(true)
    try {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
      const res = await fetch(`/api/assignments?start=${startOfMonth.toISOString()}&end=${endOfMonth.toISOString()}`)
      if (res.ok) setAssignments(await res.json())
    } catch (error) {
      console.error('Failed to load assignments:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchWorkoutDetail = async (workoutId: string) => {
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

  const loadWorkoutDetail = (workoutId: string) => {
    if (selectedWorkoutDetail?.id === workoutId) {
      setSelectedWorkoutDetail(null)
      return
    }
    fetchWorkoutDetail(workoutId)
  }

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startingDayMon = (firstDay.getDay() + 6) % 7
    const days: (Date | null)[] = []
    for (let i = 0; i < startingDayMon; i++) days.push(null)
    for (let day = 1; day <= lastDay.getDate(); day++) days.push(new Date(year, month, day))
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

  const userName = (session?.user as any)?.name || (session?.user as any)?.email || ''

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar userName={userName} />

      <main className="flex-1 lg:ml-64 min-w-0">
        {/* Top Bar */}
        <div className="px-4 lg:px-8 py-6 flex justify-between items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900 hidden lg:block">My Schedule</h1>
          <div className="flex bg-gray-100 rounded-lg p-1 ml-auto">
            <button
              onClick={() => setView('month')}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${view === 'month' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Month
            </button>
            <button
              onClick={() => { setView('day'); setSelectedWorkoutDetail(null) }}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${view === 'day' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Day
            </button>
          </div>
        </div>

        <div className="p-4 lg:p-8 lg:pt-2">

          {/* ── MONTH VIEW ── */}
          {view === 'month' && (
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-4 gap-2">
                <h2 className="text-lg lg:text-xl font-bold text-gray-900">{monthName}</h2>
                <div className="flex items-center gap-1.5">
                  <button onClick={previousMonth} className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50 transition text-gray-600">←</button>
                  <button onClick={() => { setCurrentDate(new Date()); }} className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm">Today</button>
                  <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50 transition text-gray-600">→</button>
                </div>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-6 text-sm mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-indigo-100 border border-indigo-500 rounded"></div>
                  <span className="text-gray-600">Today</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-indigo-100 rounded"></div>
                  <span className="text-gray-600">Workout assigned</span>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                  <div key={day} className="text-center font-semibold text-gray-700 py-1.5 text-xs">{day}</div>
                ))}
                {days.map((date, index) => {
                  if (!date) return <div key={`empty-${index}`} className="min-h-[60px] lg:min-h-[90px]" />
                  const dayA = getAssignmentsForDate(date)
                  const isToday = date.toDateString() === new Date().toDateString()
                  const isPast = date < new Date() && !isToday
                  return (
                    <div
                      key={date.toISOString()}
                      onClick={() => switchToDayView(date)}
                      className={`min-h-[60px] lg:min-h-[90px] border rounded-lg p-1 lg:p-1.5 cursor-pointer transition ${isToday ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'} ${isPast ? 'opacity-60' : ''}`}
                    >
                      <div className="flex flex-col h-full">
                        <div className="flex items-start justify-between mb-0.5">
                          <span className={`text-xs font-semibold ${isToday ? 'text-indigo-600' : 'text-gray-900'}`}>
                            {date.getDate()}
                          </span>
                          {!isPast && (() => {
                            const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
                            const w = weather[dateKey]
                            if (!w) return null
                            return (
                              <div className="hidden lg:flex items-center gap-0.5 flex-shrink-0">
                                <span className="text-xs leading-none">{weatherEmoji(w.code)}</span>
                                <span className="text-gray-300 text-xs leading-none">|</span>
                                <span className="text-xs leading-none text-gray-500">{w.maxTemp}°</span>
                              </div>
                            )
                          })()}
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-1">
                          {dayA.map(a => (
                            <div
                              key={a.id}
                              className="text-xs bg-indigo-100 text-indigo-700 rounded px-1.5 py-1 truncate"
                              title={`${a.workout.name} – ${a.group.name}`}
                            >
                              {a.workout.name}
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
            <div className="flex flex-col lg:flex-row gap-6 items-start">

              {/* Left panel — day + assignments */}
              <div className="w-full lg:w-80 flex-shrink-0 space-y-4">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  {/* Day navigation */}
                  <div className="flex items-center justify-between mb-5 gap-3">
                    <button onClick={previousDay} className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 transition text-gray-400 hover:text-gray-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <div className="text-center flex-1">
                      <div className="text-xs font-semibold uppercase tracking-widest text-indigo-600 mb-0.5">
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
                          <div className="text-sm font-semibold text-gray-900">{a.workout.name}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{a.group.name}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right panel — workout detail */}
              <div className="flex-1 w-full">
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
                    <p className="text-gray-500 font-medium">Tap a workout to view its details</p>
                  </div>
                )}

                {!loadingDetail && selectedWorkoutDetail && (
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="mb-5">
                      <h2 className="text-xl font-bold text-gray-900">{selectedWorkoutDetail.name}</h2>
                      {selectedWorkoutDetail.notes && (
                        <p className="text-sm text-gray-500 mt-1">{selectedWorkoutDetail.notes}</p>
                      )}
                    </div>

                    <div className="space-y-3">
                      {groupSteps(selectedWorkoutDetail.steps).map((group, gi) => {
                        if (group.kind === 'single') {
                          return (
                            <div key={gi} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                              <span className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold flex-shrink-0">{gi + 1}</span>
                              <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-2">
                                <div><div className="text-xs text-gray-400 mb-0.5">Type</div><div className="font-medium text-gray-900 capitalize text-sm">{group.step.type}</div></div>
                                <div><div className="text-xs text-gray-400 mb-0.5">Amount</div><div className="font-medium text-gray-900 text-sm">{group.step.value} {group.step.unit}</div></div>
                                <div><div className="text-xs text-gray-400 mb-0.5">Measure</div><div className="font-medium text-gray-900 capitalize text-sm">{group.step.measure}</div></div>
                                <div><div className="text-xs text-gray-400 mb-0.5">Zone</div><div className="font-medium text-gray-900 text-sm">{group.step.zone || '—'}</div></div>
                              </div>
                            </div>
                          )
                        } else {
                          return (
                            <div key={gi} className="border border-yellow-300 rounded-lg overflow-hidden">
                              <div className="bg-yellow-50 px-4 py-2 flex items-center gap-2 border-b border-yellow-200">
                                <span className="w-7 h-7 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center text-xs font-bold flex-shrink-0">{gi + 1}</span>
                                <span className="font-bold text-yellow-600">{group.count} ×</span>
                                <span className="text-sm text-yellow-600 font-medium">Repeat Block</span>
                              </div>
                              <div className="divide-y divide-yellow-100">
                                {group.steps.map((step, si) => (
                                  <div key={si} className="flex items-center gap-3 px-4 py-3">
                                    <span className="w-6 h-6 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center text-xs font-bold flex-shrink-0">{si + 1}</span>
                                    <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-2">
                                      <div><div className="text-xs text-gray-400 mb-0.5">Type</div><div className="font-medium text-gray-900 capitalize text-sm">{step.type}</div></div>
                                      <div><div className="text-xs text-gray-400 mb-0.5">Amount</div><div className="font-medium text-gray-900 text-sm">{step.value} {step.unit}</div></div>
                                      <div><div className="text-xs text-gray-400 mb-0.5">Measure</div><div className="font-medium text-gray-900 capitalize text-sm">{step.measure}</div></div>
                                      <div><div className="text-xs text-gray-400 mb-0.5">Zone</div><div className="font-medium text-gray-900 text-sm">{step.zone || '—'}</div></div>
                                    </div>
                                  </div>
                                ))}
                              </div>
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
  )
}
