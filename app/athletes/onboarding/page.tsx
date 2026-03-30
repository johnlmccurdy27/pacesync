'use client'

import { useEffect, useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

type Club = { name: string; region: string; county: string }

type Coach = {
  name: string | null
  email: string
  profilePicture: string | null
  clubName: string | null
}

type ProfileData = {
  name: string | null
  email: string
  clubName: string | null
  discipline: string | null
  profilePicture: string | null
  coaches: Coach[]
}

const DISCIPLINES = [
  'Road Running',
  'Cross Country',
  'Trail Running',
  'Track And Field',
  'Hill And Fell',
  'Race Walking',
]

export default function AthleteOnboardingPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const userId = (session?.user as any)?.id

  const [step, setStep] = useState(1)
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [form, setForm] = useState({ name: '', clubName: '', discipline: '', profilePicture: '' })
  const [saving, setSaving] = useState(false)

  // Device state
  const [watches, setWatches] = useState<{ platform: string; accessToken: string }[]>([])
  const [garminForm, setGarminForm] = useState({ email: '', password: '' })
  const [garminSaving, setGarminSaving] = useState(false)
  const [garminError, setGarminError] = useState('')
  const [garminDisconnecting, setGarminDisconnecting] = useState(false)
  const [corosForm, setCorosForm] = useState({ email: '', password: '' })
  const [corosSaving, setCorosSaving] = useState(false)
  const [corosError, setCorosError] = useState('')
  const [corosDisconnecting, setCorosDisconnecting] = useState(false)
  const [deviceError, setDeviceError] = useState('')

  const [nextWorkout, setNextWorkout] = useState<{ name: string; scheduledFor: string } | null>(null)
  const [syncing, setSyncing] = useState(false)

  const [clubs, setClubs] = useState<Club[]>([])
  const [clubSearch, setClubSearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.json())
      .then(data => {
        setProfile(data)
        setForm({
          name: data.name || '',
          clubName: data.clubName || '',
          discipline: data.discipline || '',
          profilePicture: data.profilePicture || ''
        })
        setClubSearch(data.clubName || '')
        setWatches(data.watchConnections || [])
      })
  }, [])

  useEffect(() => {
    fetch('/api/clubs').then(r => r.json()).then(setClubs).catch(() => {})
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setShowDropdown(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const garminConnection = watches.find(w => w.platform === 'garmin')
  const corosConnection = watches.find(w => w.platform === 'coros')
  const hasDevice = !!garminConnection || !!corosConnection

  const handleSaveProfile = async () => {
    setSaving(true)
    await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    setSaving(false)
    setStep(3)
  }

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
      setDeviceError('')
    } else {
      setGarminError('Failed to connect. Please check your credentials.')
    }
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
      setDeviceError('')
    } else {
      setCorosError('Failed to connect. Please check your credentials.')
    }
    setCorosSaving(false)
  }

  const handleDisconnectCoros = async () => {
    setCorosDisconnecting(true)
    const res = await fetch('/api/watch/coros', { method: 'DELETE' })
    if (res.ok) setWatches(prev => prev.filter(w => w.platform !== 'coros'))
    setCorosDisconnecting(false)
  }

  const handleAdvanceFromDevice = () => {
    if (!hasDevice) {
      setDeviceError('Please connect at least one device to continue.')
      return
    }
    setDeviceError('')
    // Load next workout for step 4
    fetch('/api/assignments?start=' + new Date().toISOString())
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setNextWorkout({ name: data[0].workout.name, scheduledFor: data[0].scheduledFor })
        }
      })
      .catch(() => {})
    setStep(4)
  }

  const handleFinish = async () => {
    setSyncing(true)
    // Mark onboarding complete
    await fetch('/api/athletes/onboarding', { method: 'POST' })
    // Trigger activity sync — don't block on failure, cap at 15s
    if (userId) {
      try {
        await Promise.race([
          fetch(`/api/athletes/${userId}/sync-activities`, { method: 'POST' }),
          new Promise(resolve => setTimeout(resolve, 15000))
        ])
      } catch { /* silent — sync can be retried from profile */ }
    }
    router.push('/athletes/dashboard')
  }

  const filteredClubs = clubSearch.length >= 2
    ? clubs.filter(c => c.name.toLowerCase().includes(clubSearch.toLowerCase())).slice(0, 40)
    : []

  const coach = profile?.coaches?.[0] ?? null
  const firstName = form.name?.split(' ')[0] || 'there'

  // Progress indicator
  const steps = ['Welcome', 'Your Profile', 'Your Device', 'All Done']

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <span className="font-bold text-indigo-600 text-lg">Structur</span>
        <span className="text-xs text-gray-400">Step {step} of {steps.length}</span>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-gray-200">
        <div
          className="h-1 bg-indigo-600 transition-all duration-500"
          style={{ width: `${(step / steps.length) * 100}%` }}
        />
      </div>

      <div className="flex-1 flex items-start justify-center p-6 pt-10">
        <div className="w-full max-w-md">

          {/* ── STEP 1: WELCOME ── */}
          {step === 1 && (
            <div className="text-center">
              <div className="w-24 h-24 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 p-2">
                <div className="relative w-full h-full">
                  <Image src="/logo.svg" alt="Structur" fill className="object-contain" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Structur</h1>
              <p className="text-gray-500 mb-8">Bring Structur to your training.</p>

              {coach && (
                <div className="bg-white rounded-xl border border-gray-200 p-5 mb-8 flex items-center gap-4 text-left">
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-indigo-100 flex-shrink-0 flex items-center justify-center">
                    {coach.profilePicture
                      ? <img src={coach.profilePicture} alt={coach.name || 'Coach'} className="w-full h-full object-cover" />
                      : <span className="text-xl font-bold text-indigo-600">{(coach.name || 'C').charAt(0).toUpperCase()}</span>
                    }
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Your Coach</div>
                    <div className="font-bold text-gray-900">{coach.name || 'Your Coach'}</div>
                    {coach.clubName && <div className="text-sm text-gray-500">{coach.clubName}</div>}
                  </div>
                </div>
              )}

              <div className="space-y-3 mb-8 text-left">
                {[
                  { icon: '📅', text: 'View your training schedule' },
                  { icon: '⌚', text: 'Sync workouts to your watch' },
                  { icon: '📊', text: 'Track your activity and progress' },
                ].map(({ icon, text }) => (
                  <div key={text} className="flex items-center gap-3 bg-white rounded-lg border border-gray-200 px-4 py-3">
                    <span className="text-xl">{icon}</span>
                    <span className="text-sm font-medium text-gray-700">{text}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setStep(2)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition"
              >
                Get Started →
              </button>
            </div>
          )}

          {/* ── STEP 2: PROFILE ── */}
          {step === 2 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Your Profile</h2>
              <p className="text-gray-500 text-sm mb-6">Let your coach know who you are.</p>

              <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5 mb-6">
                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-indigo-100 flex-shrink-0 flex items-center justify-center">
                    {form.profilePicture
                      ? <img src={form.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                      : <span className="text-2xl font-bold text-indigo-600">{(form.name || profile?.email || 'A').charAt(0).toUpperCase()}</span>
                    }
                  </div>
                  <label className="cursor-pointer bg-gray-50 hover:bg-gray-100 border border-gray-300 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg transition">
                    {form.profilePicture ? 'Change photo' : 'Add photo'}
                    <input type="file" accept="image/*" className="hidden"
                      onChange={async e => {
                        const file = e.target.files?.[0]; if (!file) return
                        const fd = new FormData(); fd.append('file', file)
                        const res = await fetch('/api/profile/upload', { method: 'POST', body: fd })
                        if (res.ok) { const { url } = await res.json(); setForm(f => ({ ...f, profilePicture: url })) }
                      }}
                    />
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Your full name"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                  />
                </div>

                <div ref={dropdownRef} className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Club</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Type to search clubs..."
                    value={clubSearch}
                    onChange={e => { setClubSearch(e.target.value); setForm({ ...form, clubName: e.target.value }); setShowDropdown(true) }}
                    onFocus={() => clubSearch.length >= 2 && setShowDropdown(true)}
                  />
                  {showDropdown && filteredClubs.length > 0 && (
                    <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
                      {filteredClubs.map(club => (
                        <li key={club.name} className="px-4 py-2.5 hover:bg-indigo-50 cursor-pointer"
                          onMouseDown={() => { setForm({ ...form, clubName: club.name }); setClubSearch(club.name); setShowDropdown(false) }}>
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
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                    value={form.discipline}
                    onChange={e => setForm({ ...form, discipline: e.target.value })}
                  >
                    <option value="">Select a discipline...</option>
                    {DISCIPLINES.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <button
                onClick={handleSaveProfile}
                disabled={saving || !form.name.trim()}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save & Continue →'}
              </button>
            </div>
          )}

          {/* ── STEP 3: DEVICE ── */}
          {step === 3 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Connect Your Device</h2>
              <p className="text-gray-500 text-sm mb-2">Connect your Garmin or COROS so your coach can sync workouts directly to your watch.</p>
              <p className="text-xs text-indigo-600 font-semibold mb-6">This step is required to continue.</p>

              {/* Garmin */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 relative flex-shrink-0">
                    <Image src="/Garmin logo.svg" alt="Garmin" fill className="object-contain" />
                  </div>
                  <span className="font-semibold text-gray-900">Garmin Connect</span>
                  {garminConnection && <span className="ml-auto text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">Connected ✓</span>}
                </div>
                {garminConnection ? (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">Connected as <span className="font-medium">{garminConnection.accessToken}</span></p>
                    <button onClick={handleDisconnectGarmin} disabled={garminDisconnecting} className="text-sm text-red-500 hover:text-red-700 font-medium transition disabled:opacity-50">
                      {garminDisconnecting ? 'Disconnecting...' : 'Disconnect'}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleConnectGarmin} className="space-y-3">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <p className="text-xs text-amber-800 font-medium">Beta feature — your credentials are stored securely.</p>
                    </div>
                    <input type="email" required placeholder="Garmin email" className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent" value={garminForm.email} onChange={e => setGarminForm(f => ({ ...f, email: e.target.value }))} />
                    <input type="password" required placeholder="Garmin password" className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent" value={garminForm.password} onChange={e => setGarminForm(f => ({ ...f, password: e.target.value }))} />
                    {garminError && <p className="text-sm text-red-600">{garminError}</p>}
                    <button type="submit" disabled={garminSaving} className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2 rounded-lg transition disabled:opacity-50">
                      {garminSaving ? 'Connecting...' : 'Connect Garmin'}
                    </button>
                  </form>
                )}
              </div>

              {/* COROS */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 relative flex-shrink-0">
                    <Image src="/Coros logo.png" alt="COROS" fill className="object-contain" />
                  </div>
                  <span className="font-semibold text-gray-900">COROS</span>
                  {corosConnection && <span className="ml-auto text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">Connected ✓</span>}
                </div>
                {corosConnection ? (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">Connected as <span className="font-medium">{corosConnection.accessToken}</span></p>
                    <button onClick={handleDisconnectCoros} disabled={corosDisconnecting} className="text-sm text-red-500 hover:text-red-700 font-medium transition disabled:opacity-50">
                      {corosDisconnecting ? 'Disconnecting...' : 'Disconnect'}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleConnectCoros} className="space-y-3">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <p className="text-xs text-amber-800 font-medium">Beta feature — your credentials are stored securely.</p>
                    </div>
                    <input type="email" required placeholder="COROS email" className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent" value={corosForm.email} onChange={e => setCorosForm(f => ({ ...f, email: e.target.value }))} />
                    <input type="password" required placeholder="COROS password" className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent" value={corosForm.password} onChange={e => setCorosForm(f => ({ ...f, password: e.target.value }))} />
                    {corosError && <p className="text-sm text-red-600">{corosError}</p>}
                    <button type="submit" disabled={corosSaving} className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2 rounded-lg transition disabled:opacity-50">
                      {corosSaving ? 'Connecting...' : 'Connect COROS'}
                    </button>
                  </form>
                )}
              </div>

              {deviceError && (
                <p className="text-sm text-red-600 font-medium mb-4">{deviceError}</p>
              )}

              <button
                onClick={handleAdvanceFromDevice}
                className={`w-full font-semibold py-3 rounded-xl transition ${hasDevice ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
              >
                {hasDevice ? 'Continue →' : 'Connect a device to continue'}
              </button>
            </div>
          )}

          {/* ── STEP 4: DONE ── */}
          {step === 4 && (
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">You're all set, {firstName}!</h2>
              <p className="text-gray-500 mb-8">Your account is ready. Your coach will assign sessions to your schedule.</p>

              {nextWorkout && (
                <div className="bg-white rounded-xl border border-indigo-200 p-5 mb-8 text-left">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Your Next Session</div>
                  <div className="font-bold text-gray-900">{nextWorkout.name}</div>
                  <div className="text-sm text-indigo-600 mt-0.5">
                    {new Date(nextWorkout.scheduledFor).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </div>
                </div>
              )}

              <button
                onClick={handleFinish}
                disabled={syncing}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-75 flex items-center justify-center gap-2"
              >
                {syncing ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Syncing your activities...
                  </>
                ) : 'Go to my dashboard →'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
