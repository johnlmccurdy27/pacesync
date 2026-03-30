'use client'

import { useEffect, useState } from 'react'
import Sidebar from '@/app/components/Sidebar'
import Link from 'next/link'
import Image from 'next/image'

function InviteModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    setError('')
    try {
      const res = await fetch('/api/athletes/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name: name || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send invite')
      setSent(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
        {sent ? (
          <div className="text-center py-4">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Invite sent!</h3>
            <p className="text-sm text-gray-500 mb-6">
              An invitation email has been sent to <strong>{email}</strong>. They'll receive a link to create their athlete account.
            </p>
            <button
              onClick={onClose}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg transition"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-start mb-5">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Invite an athlete</h3>
                <p className="text-sm text-gray-500 mt-0.5">They'll receive an email with a link to sign up.</p>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none ml-4">×</button>
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg mb-4">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Athlete name <span className="text-gray-400 font-normal">(optional)</span></label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="e.g. Jane Smith"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email address <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="athlete@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  className="flex-1 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition disabled:opacity-50"
                >
                  {sending ? 'Sending…' : 'Send Invite'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

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
  const [showInvite, setShowInvite] = useState(false)

  useEffect(() => {
    fetch('/api/athletes')
      .then(r => r.json())
      .then(setAthletes)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="flex min-h-screen bg-gray-50">
      {showInvite && <InviteModal onClose={() => setShowInvite(false)} />}
      <Sidebar />

      <main className="flex-1 lg:ml-64 min-w-0">
        <div className="px-4 lg:px-8 py-6 flex justify-between items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900 hidden lg:block">Athletes</h1>
          <button
            onClick={() => setShowInvite(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition text-sm"
          >
            <span>+</span>
            Invite Athlete
          </button>
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
            <>
              {/* Mobile card list */}
              <div className="md:hidden space-y-3">
                {athletes.map(athlete => (
                  <Link key={athlete.id} href={`/athletes/${athlete.id}`} className="block bg-white rounded-xl border border-gray-200 p-4 hover:border-indigo-300 transition">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-orange-100 flex-shrink-0 flex items-center justify-center ring-2 ring-yellow-400">
                        {athlete.profilePicture
                          ? <img src={athlete.profilePicture} alt="" className="w-full h-full object-cover" />
                          : <span className="text-sm font-bold text-orange-600">{(athlete.name || athlete.email).charAt(0).toUpperCase()}</span>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 truncate">{athlete.name || '—'}</div>
                        <div className="text-xs text-gray-400 truncate">{athlete.email}</div>
                      </div>
                      <span className="text-sm text-indigo-600 font-medium flex-shrink-0">View →</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex flex-wrap gap-1">
                        {athlete.groups.map(g => (
                          <span key={g.id} className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">{g.name}</span>
                        ))}
                        {athlete.groups.length === 0 && <span className="text-xs text-gray-400">No groups</span>}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {athlete.watchConnections.some(w => w.platform === 'garmin') && (
                          <div className="relative w-12 h-6">
                            <Image src="/Garmin logo.svg" alt="Garmin" fill className="object-contain" />
                          </div>
                        )}
                        {athlete.watchConnections.some(w => w.platform === 'coros') && (
                          <div className="relative w-12 h-6">
                            <Image src="/Coros logo.png" alt="COROS" fill className="object-contain" />
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-hidden">
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
            </>
          )}
        </div>
      </main>
    </div>
  )
}
