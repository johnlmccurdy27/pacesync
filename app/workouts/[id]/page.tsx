'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Sidebar from '@/app/components/Sidebar'

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

type Workout = {
  id: string
  name: string
  notes: string | null
  createdAt: string
  steps: Step[]
  coach?: { name: string | null; email: string }
}

type StepGroup =
  | { kind: 'single'; step: Step }
  | { kind: 'repeat'; steps: Step[]; count: number }

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

  // Legacy fallback: heuristic pattern matching for old workouts
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
        if (pattern.every((s, k) => stepsMatch(s, candidate[k]))) {
          count++
          j += w
        } else {
          break
        }
      }

      if (count >= 2) {
        groups.push({ kind: 'repeat', steps: pattern, count })
        i = j
        found = true
        break
      }
    }

    if (!found) {
      groups.push({ kind: 'single', step: steps[i] })
      i++
    }
  }

  return groups
}

export default function WorkoutDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [workoutId, setWorkoutId] = useState<string | null>(null)
  const [workout, setWorkout] = useState<Workout | null>(null)
  const [loading, setLoading] = useState(true)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    async function getWorkoutId() {
      const resolvedParams = await params
      setWorkoutId(resolvedParams.id)
    }
    getWorkoutId()
  }, [params])

  useEffect(() => {
    if (!workoutId) return
    
    async function loadWorkout() {
      try {
        const res = await fetch(`/api/workouts/${workoutId}`)
        if (res.ok) {
          const data = await res.json()
          setWorkout(data)
        }
      } catch (error) {
        console.error('Failed to load workout:', error)
      } finally {
        setLoading(false)
      }
    }
    loadWorkout()
  }, [workoutId])

  const handleDelete = async () => {
    if (!workoutId) return
    
    setDeleting(true)
    try {
      const res = await fetch(`/api/workouts/${workoutId}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        router.push('/workouts')
      }
    } catch (error) {
      console.error('Failed to delete workout:', error)
      setDeleting(false)
    }
  }

  const handleDownloadFIT = async () => {
    if (!workoutId) return
    
    setDownloading(true)
    try {
      const res = await fetch(`/api/workouts/${workoutId}/fit`)
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${workout?.name.replace(/\s+/g, '_')}.fit`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Failed to download FIT file:', error)
    } finally {
      setDownloading(false)
    }
  }

  const getStepColor = (step: Step) => {
    const type = step.type.toLowerCase()
    
    // Warmup and Cooldown get lighter indigo
    if (type === 'warmup') return '#c7d2fe'
    if (type === 'cooldown') return '#c7d2fe'

    // Main work gets darker indigo based on intensity
    const zone = step.zone?.toLowerCase() || 'easy'

    switch (zone) {
      case 'easy': return '#818cf8'
      case 'moderate': return '#6366f1'
      case 'tempo': return '#3730a3'
      case 'threshold': return '#312e81'
      case 'vo2max': return '#1e1b4b'
      case 'sprint': return '#0f0d2e'
      default: return '#6366f1'
    }
  }

  // Convert all distances to kilometers for accurate totals
  const convertToKm = (value: number, unit: string): number => {
    switch (unit.toLowerCase()) {
      case 'km': return value
      case 'mi': return value * 1.60934
      case 'm': return value / 1000
      default: return 0
    }
  }

  // Convert all times to minutes for accurate totals
  const convertToMinutes = (value: number, unit: string): number => {
    switch (unit.toLowerCase()) {
      case 'min': return value
      case 'sec': return value / 60
      case 'hr': return value * 60
      default: return 0
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 lg:ml-64 w-full flex items-center justify-center">
          <div className="text-gray-600">Loading...</div>
        </main>
      </div>
    )
  }

  if (!workout) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 lg:ml-64 w-full flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Workout not found</h1>
            <Link href="/workouts" className="text-indigo-600 hover:underline">
              Back to workouts
            </Link>
          </div>
        </main>
      </div>
    )
  }

  // Group steps for display and calculations
  const stepGroups = groupSteps(workout.steps)

  // Expand groups into flat list for chart and totals (repeat blocks multiplied out)
  const expandedSteps: (Step & { normalizedValue: number })[] = []
  for (const group of stepGroups) {
    const count = group.kind === 'repeat' ? group.count : 1
    const stepList = group.kind === 'repeat' ? group.steps : [group.step]
    for (let r = 0; r < count; r++) {
      for (const step of stepList) {
        const nv = step.measure === 'distance'
          ? convertToKm(step.value, step.unit)
          : convertToMinutes(step.value, step.unit) * 0.5
        expandedSteps.push({ ...step, normalizedValue: nv })
      }
    }
  }

  // Calculate totals using expanded steps
  const totalDistance = expandedSteps
    .filter(s => s.measure === 'distance')
    .reduce((sum, s) => sum + convertToKm(s.value, s.unit), 0)

  const totalTime = expandedSteps
    .filter(s => s.measure === 'time')
    .reduce((sum, s) => sum + convertToMinutes(s.value, s.unit), 0)

  const normalizedSteps = expandedSteps
  const totalNormalizedValue = normalizedSteps.reduce((sum, s) => sum + s.normalizedValue, 0)
  const maxNormalizedValue = Math.max(...normalizedSteps.map(s => s.normalizedValue))

  return (
    <>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        
        <main className="flex-1 lg:ml-64 min-w-0">
          <div className="p-4 lg:p-8 max-w-4xl mx-auto pt-6">
            {/* Workout Header */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
              <div className="flex justify-between items-start mb-4">
                <h1 className="text-2xl font-bold text-gray-900 mb-1">{workout.name}</h1>
                <span className="hidden md:block text-sm text-gray-400 flex-shrink-0 ml-4">
                  Created by Coach {workout.coach?.name ?? workout.coach?.email} on {new Date(workout.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>

              {/* Visual Chart - Proportional Width AND Height */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Workout Structure</h4>
                <div className="flex gap-0.5 h-32 items-end w-full">
                  {normalizedSteps.map((step, index) => {
                    const heightPercent = (step.normalizedValue / maxNormalizedValue) * 100
                    return (
                      <div
                        key={`${step.id}-${index}`}
                        className="rounded-t transition-all hover:opacity-80 cursor-pointer relative group"
                        style={{
                          flex: `${step.normalizedValue} 1 0%`,
                          height: `${heightPercent}%`,
                          backgroundColor: getStepColor(step),
                          minHeight: '15%'
                        }}
                      >
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                          <div className="bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                            {step.type}: {step.value}{step.unit} - {step.zone || 'N/A'}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-500">
                  <span>Start</span>
                  <span>End</span>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Total Steps</div>
                  <div className="text-2xl font-bold text-indigo-600">{stepGroups.length}</div>
                </div>
                {totalDistance > 0 && (
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Total Distance</div>
                    <div className="text-2xl font-bold text-indigo-600">{totalDistance.toFixed(2)} km</div>
                  </div>
                )}
                {totalTime > 0 && (
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Total Time</div>
                    <div className="text-2xl font-bold text-indigo-600">{Math.round(totalTime)} min</div>
                  </div>
                )}
              </div>
            </div>

            {/* Coach Notes */}
            {workout.notes && (
              <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Coach Notes</h3>
                <p className="text-gray-700 leading-relaxed">{workout.notes}</p>
              </div>
            )}

            {/* Workout Steps */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Workout Steps</h3>

              <div className="space-y-3">
                {(() => {
                  let singleCounter = 0
                  return stepGroups.map((group, groupIndex) => {
                    if (group.kind === 'single') {
                      singleCounter++
                      const n = singleCounter
                      return (
                        <div key={groupIndex} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                          <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-semibold">
                            {n}
                          </div>
                          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div>
                              <div className="text-xs text-gray-500 mb-1">Type</div>
                              <div className="font-medium text-gray-900 capitalize">{group.step.type}</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500 mb-1">Duration</div>
                              <div className="font-medium text-gray-900">{group.step.value} {group.step.unit}</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500 mb-1">Measure</div>
                              <div className="font-medium text-gray-900 capitalize">{group.step.measure}</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500 mb-1">Intensity</div>
                              <div className="font-medium text-gray-900">{group.step.zone || 'N/A'}</div>
                            </div>
                          </div>
                        </div>
                      )
                    } else {
                      singleCounter++
                      const n = singleCounter
                      return (
                        <div key={groupIndex} className="border border-yellow-400 rounded-lg overflow-hidden">
                          <div className="bg-yellow-50 px-4 py-2 flex items-center border-b border-yellow-300">
                            <div className="w-10 h-10 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center font-semibold flex-shrink-0">
                              {n}
                            </div>
                            <div className="flex-1 flex items-center justify-center gap-2">
                              <span className="font-bold text-yellow-600">{group.count} ×</span>
                              <span className="text-sm text-yellow-600 font-medium">Repeat Block</span>
                            </div>
                            <div className="w-10 flex-shrink-0" />
                          </div>
                          {group.steps.map((step, stepIndex) => (
                            <div key={stepIndex} className={`flex items-center gap-4 px-4 py-3 ${stepIndex < group.steps.length - 1 ? 'border-b border-yellow-200' : ''}`}>
                              <div className="flex-shrink-0 w-6 h-6 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center text-xs font-semibold">
                                {stepIndex + 1}
                              </div>
                              <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div>
                                  <div className="text-xs text-gray-500 mb-0.5">Type</div>
                                  <div className="font-medium text-gray-900 capitalize text-sm">{step.type}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500 mb-0.5">Duration</div>
                                  <div className="font-medium text-gray-900 text-sm">{step.value} {step.unit}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500 mb-0.5">Measure</div>
                                  <div className="font-medium text-gray-900 capitalize text-sm">{step.measure}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500 mb-0.5">Intensity</div>
                                  <div className="font-medium text-gray-900 text-sm">{step.zone || 'N/A'}</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    }
                  })
                })()}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleDownloadFIT}
                disabled={downloading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition disabled:opacity-50"
              >
                {downloading ? 'Generating...' : 'Download FIT File'}
              </button>
              <Link
                href={`/workouts/${workoutId}/edit`}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition text-center"
              >
                Edit
              </Link>
              <button 
                onClick={() => setShowDeleteModal(true)}
                className="px-6 py-3 border border-red-300 text-red-700 rounded-lg font-semibold hover:bg-red-50 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Workout?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{workout.name}"? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}