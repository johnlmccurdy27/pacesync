'use client'

import { useEffect, useState, useRef } from 'react'
import Sidebar from '@/app/components/Sidebar'
import FitnessChart from '@/app/components/FitnessChart'
import Image from 'next/image'

type Profile = {
  name: string | null
  email: string
  bio: string | null
  clubName: string | null
  profilePicture: string | null
}

type Club = { name: string; region: string; county: string; disciplines: string[] }

const DISCIPLINES = [
  'Road Running',
  'Cross Country',
  'Trail Running',
  'Track And Field',
  'Hill And Fell',
  'Race Walking',
]

type WatchConnection = {
  id: string
  platform: string
}

export default function AthleteProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [watches, setWatches] = useState<WatchConnection[]>([])
  const [form, setForm] = useState({ name: '', clubName: '', discipline: '', profilePicture: '' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  const [clubs, setClubs] = useState<Club[]>([])
  const [clubSearch, setClubSearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/profile').then(r => r.json()),
    ]).then(([data]) => {
      setProfile(data)
      setWatches(data.watchConnections || [])
      setForm({ name: data.name || '', clubName: data.clubName || '', discipline: data.discipline || '', profilePicture: data.profilePicture || '' })
      setClubSearch(data.clubName || '')
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    fetch('/api/clubs').then(r => r.json()).then(setClubs).catch(() => {})
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const filteredClubs = clubSearch.length >= 2
    ? clubs.filter(c => c.name.toLowerCase().includes(clubSearch.toLowerCase())).slice(0, 40)
    : []

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
    setSaving(false)
  }

  if (loading) return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 lg:ml-64 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </main>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar userName={profile?.name || profile?.email || undefined} />

      <main className="flex-1 lg:ml-64 w-full">
        <div className="px-4 lg:px-8 py-6">
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        </div>

        <div className="p-4 lg:p-8 max-w-2xl space-y-6">
          {/* Avatar + edit */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 flex items-center gap-6">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-indigo-100 flex-shrink-0 flex items-center justify-center">
              {form.profilePicture ? (
                <img src={form.profilePicture} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-bold text-indigo-600">
                  {(form.name || profile?.email || 'A').charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{form.name || 'Your Name'}</h2>
              <p className="text-gray-500 text-sm">{profile?.email}</p>
              <span className="inline-block mt-2 text-xs font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full uppercase tracking-wide">Athlete</span>
            </div>
          </div>

          {/* Edit form */}
          <form onSubmit={handleSave} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
            <h3 className="font-semibold text-gray-900">Edit Details</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div ref={dropdownRef} className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Club / Group Name</label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Type to search clubs..."
                value={clubSearch}
                onChange={e => {
                  setClubSearch(e.target.value)
                  setForm({ ...form, clubName: e.target.value })
                  setShowDropdown(true)
                }}
                onFocus={() => clubSearch.length >= 2 && setShowDropdown(true)}
              />
              {showDropdown && filteredClubs.length > 0 && (
                <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
                  {filteredClubs.map(club => (
                    <li
                      key={club.name}
                      className="px-4 py-2.5 hover:bg-indigo-50 cursor-pointer"
                      onMouseDown={() => {
                        setForm({ ...form, clubName: club.name })
                        setClubSearch(club.name)
                        setShowDropdown(false)
                      }}
                    >
                      <div className="text-sm font-medium text-gray-900">{club.name}</div>
                      <div className="text-xs text-gray-400">{club.county}, {club.region}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discipline</label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                value={form.discipline}
                onChange={e => setForm({ ...form, discipline: e.target.value })}
              >
                <option value="">Select a discipline...</option>
                {DISCIPLINES.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Profile Picture</label>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full overflow-hidden bg-indigo-100 flex-shrink-0 flex items-center justify-center">
                  {form.profilePicture ? (
                    <img src={form.profilePicture} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl font-bold text-indigo-600">{(form.name || 'A').charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <label className="cursor-pointer bg-gray-50 hover:bg-gray-100 border border-gray-300 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg transition">
                  Choose photo
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async e => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      const fd = new FormData()
                      fd.append('file', file)
                      const res = await fetch('/api/profile/upload', { method: 'POST', body: fd })
                      if (res.ok) {
                        const { url } = await res.json()
                        setForm(f => ({ ...f, profilePicture: url }))
                      }
                    }}
                  />
                </label>
                {form.profilePicture && (
                  <button type="button" onClick={() => setForm(f => ({ ...f, profilePicture: '' }))} className="text-sm text-red-400 hover:text-red-600">Remove</button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2.5 rounded-lg transition disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              {saved && <span className="text-green-600 text-sm font-medium">✓ Saved</span>}
            </div>
          </form>

          {/* Training Load */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Training Load</h3>
            <div className="flex items-center gap-6">
              <div className="flex-shrink-0 w-24 h-24 relative">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#f3f4f6" strokeWidth="10" />
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#3730a3" strokeWidth="10"
                    strokeDasharray={`${2 * Math.PI * 40 * 0.68} ${2 * Math.PI * 40}`}
                    strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-gray-900">68</span>
                  <span className="text-xs text-gray-400">/100</span>
                </div>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Moderate Load</p>
                <p className="text-sm text-gray-500 mt-1">Your current weekly training stress is within a healthy range.</p>
                <p className="text-xs text-gray-400 mt-3">* Will calculate automatically from your connected device</p>
              </div>
            </div>
          </div>

          {/* Fitness Chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Fitness Score</h3>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">Last 12 weeks</span>
            </div>
            <FitnessChart />
            <p className="text-xs text-gray-400 mt-3 text-center">* Fitness data will update automatically once your watch is connected</p>
          </div>

          {/* Connected Watch */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Connected Device</h3>
            {watches.length > 0 ? (
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center"><span className="text-2xl">⌚</span></div>
                <div>
                  <p className="font-medium text-gray-900 capitalize">{watches[0].platform}</p>
                  <p className="text-sm text-green-600 font-medium">Connected</p>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-gray-500 text-sm mb-5">Connect your device to sync workouts directly to your wrist.</p>
                <div className="flex items-center gap-8">
                  <div className="flex flex-col items-center gap-2 opacity-50 cursor-not-allowed">
                    <div className="w-20 h-12 relative">
                      <Image src="/Garmin logo.svg" alt="Garmin" fill className="object-contain" />
                    </div>
                    <span className="text-xs text-gray-400">Coming soon</span>
                  </div>
                  <div className="flex flex-col items-center gap-2 opacity-50 cursor-not-allowed">
                    <div className="w-20 h-12 relative">
                      <Image src="/Coros logo.png" alt="COROS" fill className="object-contain" />
                    </div>
                    <span className="text-xs text-gray-400">Coming soon</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
