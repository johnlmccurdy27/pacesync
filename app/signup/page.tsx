'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import LogoIcon from '@/app/components/logo.svg'

type Club = { name: string; region: string; county: string; disciplines: string[] }

const DISCIPLINES = [
  'Road Running',
  'Cross Country',
  'Trail Running',
  'Track And Field',
  'Hill And Fell',
  'Race Walking',
]

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  )
}

function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const inviteToken = searchParams.get('invite')

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'coach',
    clubName: '',
    discipline: '',
  })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Club search
  const [clubs, setClubs] = useState<Club[]>([])
  const [clubSearch, setClubSearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [loadingClubs, setLoadingClubs] = useState(true)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Invite token
  const [inviteEmail, setInviteEmail] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/clubs')
      .then(r => r.json())
      .then(data => { setClubs(data); setLoadingClubs(false) })
      .catch(() => setLoadingClubs(false))
  }, [])

  useEffect(() => {
    if (!inviteToken) return
    fetch(`/api/athletes/invite?token=${inviteToken}`)
      .then(res => {
        if (!res.ok) throw new Error('Invalid or expired invite link')
        return res.json()
      })
      .then(data => {
        setInviteEmail(data.email)
        setFormData(f => ({ ...f, email: data.email }))
      })
      .catch(err => setError(err.message))
  }, [inviteToken])

  // Close dropdown on outside click
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

  const selectClub = (club: Club) => {
    setClubSearch(club.name)
    setFormData(f => ({ ...f, clubName: club.name }))
    setShowDropdown(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          ...(inviteToken ? { inviteToken } : {}),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Signup failed')
      }

      router.push('/login')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass = "w-full px-4 py-2 bg-white border-0 rounded-lg focus:ring-2 focus:ring-yellow-400 text-gray-900"
  const labelClass = "block text-sm font-medium text-indigo-200 mb-1"

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative"
      style={{ backgroundImage: 'url(/Boston2.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div className="absolute inset-0 bg-black/55" />
      <div className="relative z-10 rounded-2xl p-8 w-full max-w-md" style={{
        background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)'
      }}>

        <div className="flex justify-center mb-2">
          <div className="w-24 h-24 flex items-center justify-center overflow-hidden">
            <Image src={LogoIcon} alt="Structur" width={160} height={160} className="object-contain scale-150" />
          </div>
        </div>

        <p className="text-center text-indigo-200 mb-6">
          {inviteEmail ? 'Create your athlete account' : 'Create your coach account'}
        </p>

        {error && (
          <div className="bg-red-500/20 text-red-200 p-3 rounded mb-4 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Name</label>
            <input
              type="text"
              required
              className={inputClass}
              value={formData.name}
              onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
            />
          </div>

          <div>
            <label className={labelClass}>Email</label>
            <input
              type="email"
              required
              readOnly={!!inviteEmail}
              className={`${inputClass} ${inviteEmail ? 'opacity-60 cursor-not-allowed' : ''}`}
              value={formData.email}
              onChange={e => setFormData(f => ({ ...f, email: e.target.value }))}
            />
            {inviteEmail && (
              <p className="text-xs text-indigo-300 mt-1">Email locked to your invite address</p>
            )}
          </div>

          <div>
            <label className={labelClass}>Password</label>
            <input
              type="password"
              required
              minLength={6}
              className={inputClass}
              value={formData.password}
              onChange={e => setFormData(f => ({ ...f, password: e.target.value }))}
            />
          </div>

          {/* Club search */}
          <div ref={dropdownRef} className="relative">
            <label className={labelClass}>Athletics Club</label>
            <input
              type="text"
              className={inputClass}
              placeholder={loadingClubs ? 'Loading clubs...' : 'Search for your club...'}
              value={clubSearch}
              disabled={loadingClubs}
              onChange={e => {
                setClubSearch(e.target.value)
                setFormData(f => ({ ...f, clubName: '' }))
                setShowDropdown(true)
              }}
              onFocus={() => clubSearch.length >= 2 && setShowDropdown(true)}
              autoComplete="off"
            />
            {showDropdown && filteredClubs.length > 0 && (
              <div className="absolute z-20 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-52 overflow-y-auto">
                {filteredClubs.map(club => (
                  <button
                    key={club.name}
                    type="button"
                    onClick={() => selectClub(club)}
                    className="w-full text-left px-4 py-2.5 hover:bg-indigo-50 transition"
                  >
                    <div className="text-sm font-medium text-gray-900">{club.name}</div>
                    <div className="text-xs text-gray-500">{[club.county, club.region].filter(Boolean).join(', ')}</div>
                  </button>
                ))}
              </div>
            )}
            {showDropdown && clubSearch.length >= 2 && filteredClubs.length === 0 && (
              <div className="absolute z-20 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 px-4 py-3">
                <p className="text-sm text-gray-500">No clubs found — try a different search</p>
              </div>
            )}
          </div>

          {/* Discipline */}
          <div>
            <label className={labelClass}>Main Discipline</label>
            <select
              required
              className={inputClass}
              value={formData.discipline}
              onChange={e => setFormData(f => ({ ...f, discipline: e.target.value }))}
            >
              <option value="">Select your main discipline...</option>
              {DISCIPLINES.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-yellow-400 hover:bg-yellow-300 text-indigo-900 font-bold py-3 rounded-lg transition mt-2 disabled:opacity-60"
          >
            {submitting ? 'Creating account...' : inviteEmail ? 'Create Athlete Account' : 'Become a Coach'}
          </button>
        </form>

        <p className="text-center text-sm text-indigo-200 mt-6">
          Already have an account?{' '}
          <a href="/login" className="text-white hover:underline font-medium">Log in</a>
        </p>
      </div>
    </div>
  )
}
