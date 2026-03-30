'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type WorkoutSummary = { id: string; name: string; createdAt: string; stepCount: number }

export default function WorkoutLibraryDropdown({ workouts }: { workouts: WorkoutSummary[] }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const filtered = workouts.filter(w => w.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition shadow-sm"
      >
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
        Workout Library
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-72 sm:w-80 max-w-[calc(100vw-2rem)] bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="p-3 border-b border-gray-100">
            <input
              autoFocus
              type="text"
              placeholder="Search workouts..."
              className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <ul className="max-h-72 overflow-y-auto">
            {filtered.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-gray-400">No workouts found</li>
            ) : filtered.map(w => (
              <li key={w.id}>
                <button
                  className="w-full text-left px-4 py-3 hover:bg-indigo-50 transition flex items-center justify-between gap-3"
                  onClick={() => { setOpen(false); router.push(`/workouts/${w.id}`) }}
                >
                  <span className="text-sm font-medium text-gray-900 truncate">{w.name}</span>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {new Date(w.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <div className="p-2 border-t border-gray-100 text-center">
            <span className="text-xs text-gray-400">{workouts.length} workout{workouts.length !== 1 ? 's' : ''} total</span>
          </div>
        </div>
      )}
    </div>
  )
}
