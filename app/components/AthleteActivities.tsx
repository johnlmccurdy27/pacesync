'use client'

import { useEffect, useState, useCallback } from 'react'

type Activity = {
  id: string
  name: string
  activityType: string
  startTime: string
  distance: number | null
  duration: number | null
  avgHR: number | null
  elevationGain: number | null
  avgSpeed: number | null
  assignment: { workout: { name: string } } | null
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

function formatDistance(metres: number): string {
  if (metres >= 1000) return `${(metres / 1000).toFixed(2)} km`
  return `${Math.round(metres)} m`
}

function formatPace(mps: number): string {
  if (mps <= 0) return '—'
  const secsPerKm = 1000 / mps
  const mins = Math.floor(secsPerKm / 60)
  const secs = Math.round(secsPerKm % 60)
  return `${mins}:${String(secs).padStart(2, '0')} /km`
}

function activityIcon(type: string): string {
  const t = type.toLowerCase()
  if (t.includes('run')) return '🏃'
  if (t.includes('cycl') || t.includes('bike') || t.includes('ride')) return '🚴'
  if (t.includes('swim')) return '🏊'
  if (t.includes('walk')) return '🚶'
  if (t.includes('hike')) return '🥾'
  return '⚡'
}

export default function AthleteActivities({ athleteId }: { athleteId: string }) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    fetch(`/api/athletes/${athleteId}/activities`)
      .then(r => r.json())
      .then(setActivities)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [athleteId])

  useEffect(() => {
    fetch(`/api/athletes/${athleteId}/sync-activities`, { method: 'POST' })
      .then(r => r.json())
      .then(data => { if (data.synced > 0) load() })
      .catch(() => {})
    load()
  }, [athleteId, load])

  const handleSync = async () => {
    setSyncing(true)
    setSyncMessage(null)
    try {
      const res = await fetch(`/api/athletes/${athleteId}/sync-activities`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setSyncMessage(`Synced ${data.synced} activities`)
        load()
      } else {
        setSyncMessage(data.error || 'Sync failed')
      }
    } catch {
      setSyncMessage('Sync failed')
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900">
          Recent Activities <span className="text-gray-400 font-normal text-sm">(last 7 days)</span>
        </h3>
        <div className="flex items-center gap-3">
          {syncMessage && <span className="text-xs text-gray-500">{syncMessage}</span>}
          <button
            onClick={handleSync}
            disabled={syncing}
            className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg font-medium transition disabled:opacity-50"
          >
            {syncing ? 'Syncing…' : '↻ Sync from Garmin'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-400 text-sm">Loading activities…</div>
      ) : activities.length === 0 ? (
        <div className="text-center py-10 text-gray-400 text-sm">
          No activities yet — syncing automatically in the background.
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-6 py-3 font-semibold text-gray-600">Activity</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Date</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Distance</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Time</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Avg Pace</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Avg HR</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Elevation</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Workout</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {activities.map(activity => (
              <tr key={activity.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-3">
                  <div className="flex items-center gap-2">
                    <span>{activityIcon(activity.activityType)}</span>
                    <span className="font-medium text-gray-900">{activity.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {new Date(activity.startTime).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {activity.distance ? formatDistance(activity.distance) : '—'}
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {activity.duration ? formatDuration(activity.duration) : '—'}
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {activity.avgSpeed ? formatPace(activity.avgSpeed) : '—'}
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {activity.avgHR ? `${activity.avgHR} bpm` : '—'}
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {activity.elevationGain ? `${Math.round(activity.elevationGain)} m` : '—'}
                </td>
                <td className="px-4 py-3">
                  {activity.assignment ? (
                    <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                      <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2L3 6v6c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V6l-9-4z" />
                      </svg>
                      {activity.assignment.workout.name}
                    </span>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
