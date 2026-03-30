'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

const ActivityMap = dynamic(() => import('./ActivityMap'), { ssr: false, loading: () => <div className="w-full h-full bg-gray-100 rounded-lg animate-pulse" /> })

type Activity = {
  id: string
  name: string
  activityType: string
  startTime: string
  distance: number | null
  duration: number | null
  avgHR: number | null
  maxHR: number | null
  elevationGain: number | null
  avgSpeed: number | null
  coordinates: [number, number][] | null
  assignment: { workout: { name: string } } | null
}

function formatDuration(s: number) {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = Math.floor(s % 60)
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  return `${m}:${String(sec).padStart(2, '0')}`
}

function formatDistance(m: number) {
  return m >= 1000 ? `${(m / 1000).toFixed(2)} km` : `${Math.round(m)} m`
}

// avgSpeed in m/s → pace as "m:ss /km"
function formatPace(mps: number): string {
  if (mps <= 0) return '—'
  const secsPerKm = 1000 / mps
  const mins = Math.floor(secsPerKm / 60)
  const secs = Math.round(secsPerKm % 60)
  return `${mins}:${String(secs).padStart(2, '0')} /km`
}

function activityIcon(type: string) {
  const t = type.toLowerCase()
  if (t.includes('run')) return '🏃'
  if (t.includes('cycl') || t.includes('bike') || t.includes('ride')) return '🚴'
  if (t.includes('swim')) return '🏊'
  if (t.includes('walk')) return '🚶'
  if (t.includes('hike')) return '🥾'
  return '⚡'
}

export default function LatestActivityCard() {
  const [activity, setActivity] = useState<Activity | null | undefined>(undefined)

  useEffect(() => {
    fetch('/api/me/latest-activity')
      .then(r => r.json())
      .then(setActivity)
      .catch(() => setActivity(null))
  }, [])

  if (activity === undefined) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
        <div className="h-4 bg-gray-100 rounded w-1/3 mb-4" />
        <div className="h-24 bg-gray-100 rounded" />
      </div>
    )
  }

  if (!activity) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-3">Latest Activity</h3>
        <p className="text-sm text-gray-400">No activities synced yet.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col md:flex-row">
      {/* Info — left side with padding */}
      <div className="flex-1 min-w-0 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Latest Activity</h3>

        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">{activityIcon(activity.activityType)}</span>
          <span className="font-bold text-gray-900 truncate">{activity.name}</span>
        </div>
        <p className="text-sm text-gray-500 mb-3">
          {new Date(activity.startTime).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
          {' · '}
          {new Date(activity.startTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
        </p>

        {activity.assignment && (
          <span className="inline-flex items-center gap-1.5 mb-3 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L3 6v6c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V6l-9-4z" />
            </svg>
            Completed: {activity.assignment.workout.name}
          </span>
        )}

        <div className="grid grid-cols-3 gap-2">
          {activity.distance && (
            <div className="bg-gray-50 rounded-lg px-3 py-2">
              <div className="text-xs text-gray-400">Distance</div>
              <div className="font-semibold text-gray-900 text-sm">{formatDistance(activity.distance)}</div>
            </div>
          )}
          {activity.duration && (
            <div className="bg-gray-50 rounded-lg px-3 py-2">
              <div className="text-xs text-gray-400">Time</div>
              <div className="font-semibold text-gray-900 text-sm">{formatDuration(activity.duration)}</div>
            </div>
          )}
          {activity.avgSpeed && (
            <div className="bg-gray-50 rounded-lg px-3 py-2">
              <div className="text-xs text-gray-400">Avg Pace</div>
              <div className="font-semibold text-gray-900 text-sm">{formatPace(activity.avgSpeed)}</div>
            </div>
          )}
          {activity.avgHR && (
            <div className="bg-gray-50 rounded-lg px-3 py-2">
              <div className="text-xs text-gray-400">Avg HR</div>
              <div className="font-semibold text-gray-900 text-sm">{activity.avgHR} bpm</div>
            </div>
          )}
          {activity.elevationGain && (
            <div className="bg-gray-50 rounded-lg px-3 py-2">
              <div className="text-xs text-gray-400">Elevation</div>
              <div className="font-semibold text-gray-900 text-sm">{Math.round(activity.elevationGain)} m</div>
            </div>
          )}
        </div>
      </div>

      {/* Map — flush to card edges */}
      <div className="h-48 md:h-auto md:w-1/2 flex-shrink-0">
        {activity.coordinates && activity.coordinates.length > 0
          ? <ActivityMap coordinates={activity.coordinates} />
          : <div className="w-full h-full bg-gray-50 flex items-center justify-center"><p className="text-xs text-gray-400">No route data</p></div>
        }
      </div>
    </div>
  )
}
