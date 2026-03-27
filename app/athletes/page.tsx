'use client'

import { useEffect, useState } from 'react'
import Sidebar from '@/app/components/Sidebar'
import Link from 'next/link'
import Image from 'next/image'

type Athlete = {
  id: string
  name: string | null
  email: string
  profilePicture: string | null
  clubName: string | null
  discipline: string | null
  createdAt: string
  groups: { id: string; name: string }[]
  watchConnections: { platform: string }[]
}

export default function AthletesPage() {
  const [athletes, setAthletes] = useState<Athlete[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/athletes')
      .then(r => r.json())
      .then(setAthletes)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 lg:ml-64 w-full">
        <div className="px-4 lg:px-8 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Athletes</h1>
        </div>

        <div className="px-4 lg:px-8 pb-8">
          {loading ? (
            <div className="text-center py-12 text-gray-400">Loading...</div>
          ) : athletes.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center border-2 border-dashed border-gray-300">
              <div className="text-6xl mb-4">👤</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No athletes yet</h3>
              <p className="text-gray-600">Invite athletes via a training group to get started.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Athlete</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Club</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Groups</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Device</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Joined</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {athletes.map(athlete => (
                    <tr key={athlete.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-orange-100 flex-shrink-0 flex items-center justify-center ring-2 ring-yellow-400">
                            {athlete.profilePicture
                              ? <img src={athlete.profilePicture} alt="" className="w-full h-full object-cover" />
                              : <span className="text-xs font-bold text-orange-600">{(athlete.name || athlete.email).charAt(0).toUpperCase()}</span>
                            }
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{athlete.name || '—'}</div>
                            <div className="text-xs text-gray-400">{athlete.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{athlete.clubName || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {athlete.groups.map(g => (
                            <span key={g.id} className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">{g.name}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {athlete.watchConnections.some(w => w.platform === 'garmin') && (
                            <div className="relative w-14 h-7" title="Garmin connected">
                              <Image src="/Garmin logo.svg" alt="Garmin" fill className="object-contain" />
                            </div>
                          )}
                          {athlete.watchConnections.some(w => w.platform === 'coros') && (
                            <div className="relative w-14 h-7" title="COROS connected">
                              <Image src="/Coros logo.png" alt="COROS" fill className="object-contain" />
                            </div>
                          )}
                          {athlete.watchConnections.length === 0 && (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-sm">
                        {new Date(athlete.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/athletes/${athlete.id}`} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                          View →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
