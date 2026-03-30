'use client'

import { useEffect, useState, useRef } from 'react'
import { signOut } from 'next-auth/react'
import Sidebar from '@/app/components/Sidebar'
import Image from 'next/image'

type WatchConnection = { platform: string; accessToken: string }

type Profile = {
  name: string | null
  email: string
  bio: string | null
  clubName: string | null
  discipline: string | null
  profilePicture: string | null
  watchConnections: WatchConnection[]
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

export default function CoachProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [watches, setWatches] = useState<WatchConnection[]>([])
  const [form, setForm] = useState({ name: '', bio: '', clubName: '', discipline: '', profilePicture: '' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  const [garminForm, setGarminForm] = useState({ email: '', password: '' })
  const [garminSaving, setGarminSaving] = useState(false)
  const [garminError, setGarminError] = useState('')
  const [garminDisconnecting, setGarminDisconnecting] = useState(false)

  const [corosForm, setCorosForm] = useState({ email: '', password: '' })
  const [corosSaving, setCorosSaving] = useState(false)
  const [corosError, setCorosError] = useState('')
  const [corosDisconnecting, setCorosDisconnecting] = useState(false)

  const [clubs, setClubs] = useState<Club[]>([])
  const [clubSearch, setClubSearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.json())
      .then(data => {
        setProfile(data)
        setWatches(data.watchConnections || [])
        setForm({
          name: data.name || '',
          bio: data.bio || '',
          clubName: data.clubName || '',
          discipline: data.discipline || '',
          profilePicture: data.profilePicture || ''
        })
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

  const garminConnection = watches.find(w => w.platform === 'garmin')
  const corosConnection = watches.find(w => w.platform === 'coros')

  const handleConnectGarmin = async (e: React.FormEvent) => {
    e.preventDefault()
    setGarminSaving(true); setGarminError('')
    const res = await fetch('/api/watch/garmin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ garminEmail: garminForm.email, garminPassword: garminForm.password })
    })
    if (res.ok) {
      setWatches(prev => [...prev.filter(w => w.platform !== 'garmin'), { platform: 'garmin', accessToken: garminForm.email }])
      setGarminForm({ email: '', password: '' })
    } else { setGarminError('Failed to save. Please try again.') }
    setGarminSaving(false)
  }

  const handleDisconnectGarmin = async () => {
    setGarminDisconnecting(true)
    const res = await fetch('/api/watch/garmin', { method: 'DELETE' })
    if (res.ok) setWatches(prev => prev.filter(w => w.platform !== 'garmin'))
    setGarminDisconnecting(false)
  }

  const handleConnectCoros = async (e: React.FormEvent) => {
    e.preventDefault()
    setCorosSaving(true); setCorosError('')
    const res = await fetch('/api/watch/coros', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ corosEmail: corosForm.email, corosPassword: corosForm.password })
    })
    if (res.ok) {
      setWatches(prev => [...prev.filter(w => w.platform !== 'coros'), { platform: 'coros', accessToken: corosForm.email }])
      setCorosForm({ email: '', password: '' })
    } else { setCorosError('Failed to save. Please try again.') }
    setCorosSaving(false)
  }

  const handleDisconnectCoros = async () => {
    setCorosDisconnecting(true)
    const res = await fetch('/api/watch/coros', { method: 'DELETE' })
    if (res.ok) setWatches(prev => prev.filter(w => w.platform !== 'coros'))
    setCorosDisconnecting(false)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    if (res.ok) {
      const data = await res.json()
      setProfile(data)
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

      <main className="flex-1 lg:ml-64 min-w-0">
        <div className="px-4 lg:px-8 py-6">
          <h1 className="text-2xl font-bold text-gray-900 hidden lg:block">My Profile</h1>
        </div>

        <div className="p-4 lg:p-8 max-w-2xl">
          {/* Avatar */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 flex items-center gap-6">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-indigo-100 flex-shrink-0 flex items-center justify-center">
              {form.profilePicture ? (
                <img src={form.profilePicture} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-bold text-indigo-600">
                  {(form.name || profile?.email || 'U').charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{form.name || 'Your Name'}</h2>
              <p className="text-gray-500 text-sm">{profile?.email}</p>
              {form.clubName && <p className="text-indigo-600 text-sm font-medium mt-1">{form.clubName}</p>}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSave} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Short Bio</label>
              <textarea
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                placeholder="Tell your athletes a little about yourself..."
                value={form.bio}
                onChange={e => setForm({ ...form, bio: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Profile Picture</label>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full overflow-hidden bg-indigo-100 flex-shrink-0 flex items-center justify-center">
                  {form.profilePicture ? (
                    <img src={form.profilePicture} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl font-bold text-indigo-600">{(form.name || 'U').charAt(0).toUpperCase()}</span>
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

            <div className="flex items-center gap-4 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2.5 rounded-lg transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              {saved && <span className="text-green-600 text-sm font-medium">✓ Saved</span>}
            </div>
          </form>

          {/* Garmin Connect */}
          <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 relative flex-shrink-0">
                <Image src="/Garmin logo.svg" alt="Garmin" fill className="object-contain" />
              </div>
              <h3 className="font-semibold text-gray-900">Garmin Connect</h3>
              {garminConnection && <span className="ml-auto text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">Connected</span>}
            </div>
            {garminConnection ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">Connected as <span className="font-medium text-gray-900">{garminConnection.accessToken}</span></p>
                <button onClick={handleDisconnectGarmin} disabled={garminDisconnecting} className="text-sm text-red-500 hover:text-red-700 font-medium transition disabled:opacity-50">
                  {garminDisconnecting ? 'Disconnecting...' : 'Disconnect Garmin'}
                </button>
              </div>
            ) : (
              <form onSubmit={handleConnectGarmin} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Garmin Email</label>
                  <input type="email" required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm" placeholder="your@email.com" value={garminForm.email} onChange={e => setGarminForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Garmin Password</label>
                  <input type="password" required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm" placeholder="••••••••" value={garminForm.password} onChange={e => setGarminForm(f => ({ ...f, password: e.target.value }))} />
                </div>
                {garminError && <p className="text-sm text-red-600">{garminError}</p>}
                <button type="submit" disabled={garminSaving} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2 rounded-lg text-sm transition disabled:opacity-50">
                  {garminSaving ? 'Connecting...' : 'Connect Garmin'}
                </button>
              </form>
            )}
          </div>

          {/* COROS Connect */}
          <div className="mt-4 bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 relative flex-shrink-0">
                <Image src="/Coros logo.png" alt="COROS" fill className="object-contain" />
              </div>
              <h3 className="font-semibold text-gray-900">COROS</h3>
              {corosConnection && <span className="ml-auto text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">Connected</span>}
            </div>
            {corosConnection ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">Connected as <span className="font-medium text-gray-900">{corosConnection.accessToken}</span></p>
                <button onClick={handleDisconnectCoros} disabled={corosDisconnecting} className="text-sm text-red-500 hover:text-red-700 font-medium transition disabled:opacity-50">
                  {corosDisconnecting ? 'Disconnecting...' : 'Disconnect COROS'}
                </button>
              </div>
            ) : (
              <form onSubmit={handleConnectCoros} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">COROS Email</label>
                  <input type="email" required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm" placeholder="your@email.com" value={corosForm.email} onChange={e => setCorosForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">COROS Password</label>
                  <input type="password" required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm" placeholder="••••••••" value={corosForm.password} onChange={e => setCorosForm(f => ({ ...f, password: e.target.value }))} />
                </div>
                {corosError && <p className="text-sm text-red-600">{corosError}</p>}
                <button type="submit" disabled={corosSaving} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2 rounded-lg text-sm transition disabled:opacity-50">
                  {corosSaving ? 'Connecting...' : 'Connect COROS'}
                </button>
              </form>
            )}
          </div>

          {/* Sign Out */}
          <div className="mt-6">
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="w-full flex items-center gap-3 px-5 py-3 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
