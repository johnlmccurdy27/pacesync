'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/app/components/Sidebar'

type StepType = 'warmup' | 'main' | 'cooldown' | 'interval' | 'recovery'

type Step = {
  id: string
  type: StepType
  measure: 'distance' | 'time'
  value: number
  unit: string
  zone?: string
}

type Block = {
  id: string
  blockType: 'single' | 'repeat'
  steps: Step[]
  repeatCount?: number
}

type DBStep = {
  id: string
  type: string
  measure: string
  value: number
  unit: string
  zone: string | null
  position: number
}

function groupDBSteps(steps: DBStep[]) {
  const groups: Array<{ kind: 'single'; step: DBStep } | { kind: 'repeat'; steps: DBStep[]; count: number }> = []
  let i = 0

  const match = (a: DBStep, b: DBStep) =>
    a.type === b.type && a.value === b.value && a.unit === b.unit && a.measure === b.measure

  while (i < steps.length) {
    let found = false
    const maxW = Math.min(6, Math.floor((steps.length - i) / 2))

    for (let w = 2; w <= maxW; w++) {
      const pattern = steps.slice(i, i + w)
      let count = 1
      let j = i + w

      while (j + w <= steps.length) {
        if (pattern.every((s, k) => match(s, steps[j + k]))) { count++; j += w }
        else break
      }

      if (count >= 2) {
        groups.push({ kind: 'repeat', steps: pattern, count })
        i = j; found = true; break
      }
    }

    if (!found) { groups.push({ kind: 'single', step: steps[i] }); i++ }
  }

  return groups
}

const makeId = () => Math.random().toString(36).substr(2, 9)

function dbStepsToBlocks(steps: DBStep[]): Block[] {
  return groupDBSteps(steps).map(g => {
    if (g.kind === 'single') {
      return {
        id: makeId(),
        blockType: 'single' as const,
        steps: [{
          id: makeId(),
          type: g.step.type as StepType,
          measure: g.step.measure as 'distance' | 'time',
          value: g.step.value,
          unit: g.step.unit,
          zone: g.step.zone || undefined
        }]
      }
    } else {
      return {
        id: makeId(),
        blockType: 'repeat' as const,
        repeatCount: g.count,
        steps: g.steps.map(s => ({
          id: makeId(),
          type: s.type as StepType,
          measure: s.measure as 'distance' | 'time',
          value: s.value,
          unit: s.unit,
          zone: s.zone || undefined
        }))
      }
    }
  })
}

export default function EditWorkoutPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [workoutId, setWorkoutId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [notes, setNotes] = useState('')
  const [blocks, setBlocks] = useState<Block[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    params.then(p => setWorkoutId(p.id))
  }, [params])

  useEffect(() => {
    if (!workoutId) return
    fetch(`/api/workouts/${workoutId}`)
      .then(r => r.json())
      .then(data => {
        setName(data.name)
        setNotes(data.notes || '')
        setBlocks(dbStepsToBlocks(data.steps))
      })
      .catch(() => setError('Failed to load workout'))
      .finally(() => setLoading(false))
  }, [workoutId])

  const addSingleStep = () => {
    setBlocks(b => [...b, {
      id: makeId(), blockType: 'single',
      steps: [{ id: makeId(), type: 'main', measure: 'distance', value: 5, unit: 'km', zone: 'Easy' }]
    }])
  }

  const addRepeatBlock = () => {
    setBlocks(b => [...b, {
      id: makeId(), blockType: 'repeat', repeatCount: 4,
      steps: [
        { id: makeId(), type: 'interval', measure: 'distance', value: 1, unit: 'km', zone: 'Tempo' },
        { id: makeId(), type: 'recovery', measure: 'time', value: 60, unit: 'sec', zone: 'Easy' }
      ]
    }])
  }

  const updateRepeatCount = (blockId: string, count: number) =>
    setBlocks(b => b.map(bl => bl.id === blockId ? { ...bl, repeatCount: count } : bl))

  const addStepToBlock = (blockId: string) =>
    setBlocks(b => b.map(bl => bl.id === blockId
      ? { ...bl, steps: [...bl.steps, { id: makeId(), type: 'recovery', measure: 'distance', value: 1, unit: 'km', zone: 'Easy' }] }
      : bl))

  const updateStep = (blockId: string, stepId: string, updates: Partial<Step>) =>
    setBlocks(b => b.map(bl => bl.id === blockId
      ? { ...bl, steps: bl.steps.map(s => s.id === stepId ? { ...s, ...updates } : s) }
      : bl))

  const removeStep = (blockId: string, stepId: string) =>
    setBlocks(b => b.map(bl => bl.id === blockId
      ? { ...bl, steps: bl.steps.filter(s => s.id !== stepId) }
      : bl))

  const removeBlock = (blockId: string) =>
    setBlocks(b => b.filter(bl => bl.id !== blockId))

  const moveBlock = (index: number, dir: -1 | 1) => {
    const next = index + dir
    if (next < 0 || next >= blocks.length) return
    const nb = [...blocks];
    [nb[index], nb[next]] = [nb[next], nb[index]]
    setBlocks(nb)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    if (!name.trim()) { setError('Workout name is required'); setSaving(false); return }
    if (blocks.length === 0) { setError('Add at least one step'); setSaving(false); return }

    const allSteps: any[] = []
    blocks.forEach(block => {
      const repeat = block.blockType === 'repeat' ? (block.repeatCount || 1) : 1
      for (let i = 0; i < repeat; i++) {
        block.steps.forEach(step => {
          allSteps.push({ type: step.type, measure: step.measure, value: step.value, unit: step.unit, zone: step.zone })
        })
      }
    })

    try {
      const res = await fetch(`/api/workouts/${workoutId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, notes, steps: allSteps.map((s, i) => ({ ...s, position: i })) })
      })
      if (!res.ok) throw new Error()
      router.push(`/workouts/${workoutId}`)
    } catch {
      setError('Failed to update workout. Please try again.')
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 lg:ml-64 min-w-0 flex items-center justify-center">
          <div className="text-gray-600">Loading...</div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 lg:ml-64 min-w-0">
        <div className="px-4 lg:px-8 py-6">
          <h1 className="text-2xl font-bold text-gray-900 hidden lg:block">Edit Workout</h1>
        </div>

        <div className="p-4 lg:p-8 max-w-5xl mx-auto">
          {error && <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Details */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Workout Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Workout Name *</label>
                  <input
                    type="text" required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="e.g. Tuesday Intervals"
                    value={name} onChange={e => setName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                  <textarea
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Add any instructions or notes..." rows={3}
                    value={notes} onChange={e => setNotes(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Builder */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Workout Structure</h3>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={addSingleStep}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition">
                    + Add Step
                  </button>
                  <button type="button" onClick={addRepeatBlock}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition">
                    + Add Repeat Block
                  </button>
                </div>
              </div>

              {blocks.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                  <p className="text-gray-600 mb-4">No steps added yet</p>
                  <div className="flex gap-2 justify-center">
                    <button type="button" onClick={addSingleStep} className="text-indigo-600 hover:text-indigo-700 font-semibold">Add a step</button>
                    <span className="text-gray-400">or</span>
                    <button type="button" onClick={addRepeatBlock} className="text-yellow-600 font-semibold">Add an interval block</button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {blocks.map((block, blockIndex) => (
                    <div key={block.id} className={`border-2 rounded-lg p-4 ${block.blockType === 'repeat' ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200'}`}>
                      {/* Block Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {block.blockType === 'repeat' && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-yellow-700">Repeat</span>
                              <div className="flex items-center gap-1">
                                <button type="button"
                                  onClick={() => updateRepeatCount(block.id, Math.max(1, (block.repeatCount || 1) - 1))}
                                  className="w-8 h-8 rounded-lg border border-yellow-400 bg-white text-yellow-700 font-bold text-base flex items-center justify-center hover:bg-yellow-50 active:bg-yellow-100">
                                  −
                                </button>
                                <span className="w-8 text-center font-bold text-yellow-800">{block.repeatCount || 1}</span>
                                <button type="button"
                                  onClick={() => updateRepeatCount(block.id, Math.min(20, (block.repeatCount || 1) + 1))}
                                  className="w-8 h-8 rounded-lg border border-yellow-400 bg-white text-yellow-700 font-bold text-base flex items-center justify-center hover:bg-yellow-50 active:bg-yellow-100">
                                  +
                                </button>
                              </div>
                              <span className="text-sm text-yellow-700">times</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button type="button" onClick={() => moveBlock(blockIndex, -1)} disabled={blockIndex === 0}
                            className="p-1 text-gray-600 hover:text-gray-900 disabled:opacity-30">↑</button>
                          <button type="button" onClick={() => moveBlock(blockIndex, 1)} disabled={blockIndex === blocks.length - 1}
                            className="p-1 text-gray-600 hover:text-gray-900 disabled:opacity-30">↓</button>
                          <button type="button" onClick={() => removeBlock(block.id)}
                            className="p-1 text-red-600 hover:text-red-700">✕</button>
                        </div>
                      </div>

                      {/* Steps */}
                      <div className="space-y-2">
                        {block.steps.map((step, stepIndex) => (
                          <div key={step.id} className="bg-white border border-gray-200 rounded-lg p-3">
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-semibold text-xs">
                                {stepIndex + 1}
                              </div>
                              <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-2">
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                                  <select className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                                    value={step.type}
                                    onChange={e => updateStep(block.id, step.id, { type: e.target.value as StepType })}>
                                    <option value="warmup">Warmup</option>
                                    <option value="main">Main</option>
                                    <option value="interval">Interval</option>
                                    <option value="recovery">Recovery</option>
                                    <option value="cooldown">Cooldown</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Measure</label>
                                  <select className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                                    value={step.measure}
                                    onChange={e => {
                                      const measure = e.target.value as 'distance' | 'time'
                                      updateStep(block.id, step.id, { measure, unit: measure === 'distance' ? 'km' : 'min' })
                                    }}>
                                    <option value="distance">Distance</option>
                                    <option value="time">Time</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Duration</label>
                                  <div className="flex gap-1">
                                    <input type="number" min="0" step="0.1"
                                      className="w-14 px-2 py-1.5 border border-gray-300 rounded text-sm"
                                      value={step.value || ''}
                                      onChange={e => updateStep(block.id, step.id, { value: parseFloat(e.target.value) || 0 })} />
                                    <select className="flex-1 px-1 py-1.5 border border-gray-300 rounded text-sm"
                                      value={step.unit}
                                      onChange={e => updateStep(block.id, step.id, { unit: e.target.value })}>
                                      {step.measure === 'distance'
                                        ? <><option value="km">km</option><option value="mi">mi</option><option value="m">m</option></>
                                        : <><option value="min">min</option><option value="sec">sec</option></>}
                                    </select>
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Intensity</label>
                                  <select className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                                    value={step.zone || 'Easy'}
                                    onChange={e => updateStep(block.id, step.id, { zone: e.target.value })}>
                                    <option value="Easy">Easy</option>
                                    <option value="Moderate">Moderate</option>
                                    <option value="Tempo">Tempo</option>
                                    <option value="Threshold">Threshold</option>
                                    <option value="VO2Max">VO2 Max</option>
                                    <option value="Sprint">Sprint</option>
                                  </select>
                                </div>
                              </div>
                              <button type="button" onClick={() => removeStep(block.id, step.id)}
                                className="flex-shrink-0 text-red-600 hover:text-red-700 text-sm">✕</button>
                            </div>
                          </div>
                        ))}

                        {block.blockType === 'repeat' && (
                          <button type="button" onClick={() => addStepToBlock(block.id)}
                            className="w-full py-2 border-2 border-dashed border-yellow-400 rounded-lg text-yellow-600 hover:bg-yellow-50 text-sm font-semibold transition">
                            + Add step to block
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button type="button" onClick={() => router.push(`/workouts/${workoutId}`)} disabled={saving}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition disabled:opacity-50">
                Cancel
              </button>
              <button type="submit" disabled={saving}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
