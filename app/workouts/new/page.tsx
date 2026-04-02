'use client'

import { useState } from 'react'
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

type Block = {
  id: string
  blockType: 'single' | 'repeat'
  steps: Step[]
  repeatCount?: number
}

export default function NewWorkoutPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [notes, setNotes] = useState('')
  const [blocks, setBlocks] = useState<Block[]>([])
  const [error, setError] = useState('')

  const addSingleStep = () => {
    const newBlock: Block = {
      id: Math.random().toString(36).substr(2, 9),
      blockType: 'single',
      steps: [{
        id: Math.random().toString(36).substr(2, 9),
        type: 'main',
        measure: 'distance',
        value: 5,
        unit: 'km',
        zone: 'Easy'
      }]
    }
    setBlocks([...blocks, newBlock])
  }

  const addRepeatBlock = () => {
    const newBlock: Block = {
      id: Math.random().toString(36).substr(2, 9),
      blockType: 'repeat',
      repeatCount: 4,
      steps: [
        {
          id: Math.random().toString(36).substr(2, 9),
          type: 'interval',
          measure: 'distance',
          value: 2,
          unit: 'km',
          zone: 'Tempo'
        },
        {
          id: Math.random().toString(36).substr(2, 9),
          type: 'recovery',
          measure: 'time',
          value: 60,
          unit: 'sec',
          zone: 'Easy'
        }
      ]
    }
    setBlocks([...blocks, newBlock])
  }

  const updateBlockRepeatCount = (blockId: string, count: number) => {
    setBlocks(blocks.map(block =>
      block.id === blockId ? { ...block, repeatCount: count } : block
    ))
  }

  const addStepToBlock = (blockId: string) => {
    setBlocks(blocks.map(block => {
      if (block.id === blockId) {
        const newStep: Step = {
          id: Math.random().toString(36).substr(2, 9),
          type: block.steps.length === 0 ? 'interval' : 'recovery',
          measure: 'distance',
          value: 1,
          unit: 'km',
          zone: 'Easy'
        }
        return { ...block, steps: [...block.steps, newStep] }
      }
      return block
    }))
  }

  const updateStep = (blockId: string, stepId: string, updates: Partial<Step>) => {
    setBlocks(blocks.map(block => {
      if (block.id === blockId) {
        return {
          ...block,
          steps: block.steps.map(step =>
            step.id === stepId ? { ...step, ...updates } : step
          )
        }
      }
      return block
    }))
  }

  const removeStep = (blockId: string, stepId: string) => {
    setBlocks(blocks.map(block => {
      if (block.id === blockId) {
        return {
          ...block,
          steps: block.steps.filter(step => step.id !== stepId)
        }
      }
      return block
    }))
  }

  const removeBlock = (blockId: string) => {
    setBlocks(blocks.filter(block => block.id !== blockId))
  }

  const moveBlockUp = (index: number) => {
    if (index === 0) return
    const newBlocks = [...blocks]
    const temp = newBlocks[index]
    newBlocks[index] = newBlocks[index - 1]
    newBlocks[index - 1] = temp
    setBlocks(newBlocks)
  }

  const moveBlockDown = (index: number) => {
    if (index === blocks.length - 1) return
    const newBlocks = [...blocks]
    const temp = newBlocks[index]
    newBlocks[index] = newBlocks[index + 1]
    newBlocks[index + 1] = temp
    setBlocks(newBlocks)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Workout name is required')
      return
    }

    if (blocks.length === 0) {
      setError('Add at least one step to your workout')
      return
    }

    // Build steps — repeat blocks stored with a shared repeatGroup ID, NOT unrolled
    const allSteps: any[] = []
    let position = 0
    blocks.forEach(block => {
      if (block.blockType === 'single') {
        block.steps.forEach(step => {
          allSteps.push({ type: step.type, measure: step.measure, value: step.value, unit: step.unit, zone: step.zone, repeatGroup: null, repeatCount: null, position: position++ })
        })
      } else {
        const groupId = Math.random().toString(36).substr(2, 9)
        const count = block.repeatCount || 1
        block.steps.forEach((step, i) => {
          allSteps.push({ type: step.type, measure: step.measure, value: step.value, unit: step.unit, zone: step.zone, repeatGroup: groupId, repeatCount: i === 0 ? count : null, position: position++ })
        })
      }
    })

    try {
      const res = await fetch('/api/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          notes,
          steps: allSteps
        })
      })

      if (!res.ok) {
        throw new Error('Failed to create workout')
      }

      router.push('/workouts')
    } catch (err) {
      setError('Failed to create workout. Please try again.')
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <main className="flex-1 lg:ml-64 min-w-0">
        {/* Top Bar */}
        <div className="px-4 lg:px-8 py-6">
          <h1 className="text-2xl font-bold text-gray-900 hidden lg:block">Create Workout</h1>
        </div>

        <div className="p-4 lg:p-8 max-w-5xl mx-auto">
          <div className="mb-6">
            <p className="text-gray-600">Build structured training sessions with intervals and repeats</p>
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

            {/* Workout Builder */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Workout Structure</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={addSingleStep}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
                  >
                    + Add Step
                  </button>
                  <button
                    type="button"
                    onClick={addRepeatBlock}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
                  >
                    + Add Repeat Block
                  </button>
                </div>
              </div>

              {blocks.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                  <p className="text-gray-600 mb-4">No steps added yet</p>
                  <div className="flex gap-2 justify-center">
                    <button
                      type="button"
                      onClick={addSingleStep}
                      className="text-indigo-600 hover:text-indigo-700 font-semibold"
                    >
                      Add a step
                    </button>
                    <span className="text-gray-400">or</span>
                    <button
                      type="button"
                      onClick={addRepeatBlock}
                      className="text-yellow-600 hover:text-yellow-600 font-semibold"
                    >
                      Add an interval block
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {blocks.map((block, blockIndex) => (
                    <div
                      key={block.id}
                      className={`border-2 rounded-lg p-4 ${
                        block.blockType === 'repeat' 
                          ? 'border-yellow-400 bg-yellow-50' 
                          : 'border-gray-200'
                      }`}
                    >
                      {/* Block Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {block.blockType === 'repeat' && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-yellow-700">Repeat</span>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => updateBlockRepeatCount(block.id, Math.max(1, (block.repeatCount || 1) - 1))}
                                  className="w-8 h-8 rounded-lg border border-yellow-400 bg-white text-yellow-700 font-bold text-base flex items-center justify-center hover:bg-yellow-50 active:bg-yellow-100"
                                >
                                  −
                                </button>
                                <span className="w-8 text-center font-bold text-yellow-800">{block.repeatCount || 1}</span>
                                <button
                                  type="button"
                                  onClick={() => updateBlockRepeatCount(block.id, Math.min(20, (block.repeatCount || 1) + 1))}
                                  className="w-8 h-8 rounded-lg border border-yellow-400 bg-white text-yellow-700 font-bold text-base flex items-center justify-center hover:bg-yellow-50 active:bg-yellow-100"
                                >
                                  +
                                </button>
                              </div>
                              <span className="text-sm text-yellow-700">times</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => moveBlockUp(blockIndex)}
                            disabled={blockIndex === 0}
                            className="p-1 text-gray-600 hover:text-gray-900 disabled:opacity-30"
                            title="Move up"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            onClick={() => moveBlockDown(blockIndex)}
                            disabled={blockIndex === blocks.length - 1}
                            className="p-1 text-gray-600 hover:text-gray-900 disabled:opacity-30"
                            title="Move down"
                          >
                            ↓
                          </button>
                          <button
                            type="button"
                            onClick={() => removeBlock(block.id)}
                            className="p-1 text-red-600 hover:text-red-700"
                            title="Delete block"
                          >
                            ✕
                          </button>
                        </div>
                      </div>

                      {/* Steps in Block */}
                      <div className="space-y-2">
                        {block.steps.map((step, stepIndex) => (
                          <div key={step.id} className="bg-white border border-gray-200 rounded-lg p-3">
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-semibold text-xs">
                                {stepIndex + 1}
                              </div>
                              
                              <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-2">
                                {/* Type */}
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                                  <select
                                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                                    value={step.type}
                                    onChange={(e) => updateStep(block.id, step.id, { type: e.target.value as Step['type'] })}
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
                                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                                    value={step.measure}
                                    onChange={(e) => {
                                      const measure = e.target.value as 'distance' | 'time'
                                      updateStep(block.id, step.id, { 
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
                                      className="w-14 px-2 py-1.5 border border-gray-300 rounded text-sm"
                                      value={step.value || ''}
                                      onChange={(e) => updateStep(block.id, step.id, { value: parseFloat(e.target.value) || 0 })}
                                    />
                                    <select
                                      className="flex-1 px-1 py-1.5 border border-gray-300 rounded text-sm"
                                      value={step.unit}
                                      onChange={(e) => updateStep(block.id, step.id, { unit: e.target.value })}
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
                                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                                    value={step.zone || 'Easy'}
                                    onChange={(e) => updateStep(block.id, step.id, { zone: e.target.value })}
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
                                onClick={() => removeStep(block.id, step.id)}
                                className="flex-shrink-0 text-red-600 hover:text-red-700 text-sm"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ))}

                        {/* Add Step to Block */}
                        {block.blockType === 'repeat' && (
                          <button
                            type="button"
                            onClick={() => addStepToBlock(block.id)}
                            className="w-full py-2 border-2 border-dashed border-yellow-400 rounded-lg text-yellow-600 hover:bg-yellow-50 text-sm font-semibold transition"
                          >
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
              <button
                type="button"
                onClick={() => router.push('/workouts')}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition"
              >
                Create Workout
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}