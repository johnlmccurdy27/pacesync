'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/app/components/Sidebar'

type Step = {
  id: string
  type: 'warmup' | 'main' | 'cooldown' | 'interval' | 'recovery'
  measure: 'distance' | 'time'
  value: number
  unit: string
  zone?: string
}

export default function EditWorkoutPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [workoutId, setWorkoutId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [notes, setNotes] = useState('')
  const [steps, setSteps] = useState<Step[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

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
          setName(data.name)
          setNotes(data.notes || '')
          setSteps(data.steps.map((s: any) => ({
            id: s.id,
            type: s.type,
            measure: s.measure,
            value: s.value,
            unit: s.unit,
            zone: s.zone
          })))
        }
      } catch (error) {
        console.error('Failed to load workout:', error)
        setError('Failed to load workout')
      } finally {
        setLoading(false)
      }
    }
    loadWorkout()
  }, [workoutId])

  const addStep = () => {
    const newStep: Step = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'main',
      measure: 'distance',
      value: 5,
      unit: 'km',
      zone: 'Easy'
    }
    setSteps([...steps, newStep])
  }

  const updateStep = (id: string, updates: Partial<Step>) => {
    setSteps(steps.map(step => 
      step.id === id ? { ...step, ...updates } : step
    ))
  }

  const removeStep = (id: string) => {
    setSteps(steps.filter(step => step.id !== id))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    if (!name.trim()) {
      setError('Workout name is required')
      setSaving(false)
      return
    }

    if (steps.length === 0) {
      setError('Add at least one step to your workout')
      setSaving(false)
      return
    }

    try {
      const res = await fetch(`/api/workouts/${workoutId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          notes,
          steps: steps.map((step, index) => ({
            id: step.id.length > 20 ? undefined : step.id, // Only include DB IDs
            position: index,
            type: step.type,
            measure: step.measure,
            value: step.value,
            unit: step.unit,
            zone: step.zone
          }))
        })
      })

      if (!res.ok) {
        throw new Error('Failed to update workout')
      }

      router.push(`/workouts/${workoutId}`)
    } catch (err) {
      setError('Failed to update workout. Please try again.')
      setSaving(false)
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

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <main className="flex-1 lg:ml-64 w-full">
        {/* Top Bar */}
        <div className="px-4 lg:px-8 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Edit Workout</h1>
        </div>

        <div className="p-4 lg:p-8 max-w-4xl mx-auto">
          <div className="mb-6">
            <p className="text-gray-600">Update your training session</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Workout Details */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Workout Details</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Workout Name *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="e.g. Tuesday Intervals"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (optional)
                  </label>
                  <textarea
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Add any instructions or notes..."
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Workout Steps */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Workout Steps</h3>
                <button
                  type="button"
                  onClick={addStep}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
                >
                  + Add Step
                </button>
              </div>

              {steps.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                  <p className="text-gray-600 mb-4">No steps added yet</p>
                  <button
                    type="button"
                    onClick={addStep}
                    className="text-indigo-600 hover:text-indigo-700 font-semibold"
                  >
                    Add your first step
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {steps.map((step, index) => (
                    <div key={step.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-semibold text-sm">
                          {index + 1}
                        </div>
                        
                        <div className="flex-1 grid grid-cols-4 gap-3">
                          {/* Type */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                            <select
                              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                              value={step.type}
                              onChange={(e) => updateStep(step.id, { type: e.target.value as Step['type'] })}
                            >
                              <option value="warmup">Warmup</option>
                              <option value="main">Main</option>
                              <option value="interval">Interval</option>
                              <option value="recovery">Recovery</option>
                              <option value="cooldown">Cooldown</option>
                            </select>
                          </div>

                          {/* Measure */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Measure</label>
                            <select
                              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                              value={step.measure}
                              onChange={(e) => {
                                const measure = e.target.value as 'distance' | 'time'
                                updateStep(step.id, { 
                                  measure,
                                  unit: measure === 'distance' ? 'km' : 'min'
                                })
                              }}
                            >
                              <option value="distance">Distance</option>
                              <option value="time">Time</option>
                            </select>
                          </div>

                          {/* Value & Unit */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Duration</label>
                            <div className="flex gap-1">
                              <input
                                type="number"
                                min="0"
                                step="0.1"
                                className="w-16 px-2 py-2 border border-gray-300 rounded text-sm"
                                value={step.value || ''}
                                onChange={(e) => updateStep(step.id, { value: parseFloat(e.target.value) || 0 })}
                              />
                              <select
                                className="flex-1 px-2 py-2 border border-gray-300 rounded text-sm"
                                value={step.unit}
                                onChange={(e) => updateStep(step.id, { unit: e.target.value })}
                              >
                                {step.measure === 'distance' ? (
                                  <>
                                    <option value="km">km</option>
                                    <option value="mi">mi</option>
                                    <option value="m">m</option>
                                  </>
                                ) : (
                                  <>
                                    <option value="min">min</option>
                                    <option value="sec">sec</option>
                                  </>
                                )}
                              </select>
                            </div>
                          </div>

                          {/* Zone */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Intensity</label>
                            <select
                              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                              value={step.zone || 'Easy'}
                              onChange={(e) => updateStep(step.id, { zone: e.target.value })}
                            >
                              <option value="Easy">Easy</option>
                              <option value="Moderate">Moderate</option>
                              <option value="Tempo">Tempo</option>
                              <option value="Threshold">Threshold</option>
                              <option value="VO2Max">VO2 Max</option>
                              <option value="Sprint">Sprint</option>
                            </select>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeStep(step.id)}
                          className="flex-shrink-0 text-red-600 hover:text-red-700 p-1"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => router.push(`/workouts/${workoutId}`)}
                disabled={saving}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}