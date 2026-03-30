'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/app/components/Sidebar'
import LatestActivityCard from '@/app/components/LatestActivityCard'

type User = {
  id: string
  name: string | null
  email: string
  role: string
  isAdmin: boolean
  isCoach: boolean
  isAthlete: boolean
  clubName: string | null
  discipline: string | null
  createdAt: string
}

function RoleToggle({
  label,
  active,
  disabled,
  onChange,
  color,
}: {
  label: string
  active: boolean
  disabled?: boolean
  onChange: (val: boolean) => void
  color: 'purple' | 'orange' | 'yellow'
}) {
  const colors = {
    purple: active ? 'text-indigo-600 font-semibold' : 'text-gray-300',
    orange: active ? 'text-orange-500 font-semibold' : 'text-gray-300',
    yellow: active ? 'text-yellow-500 font-semibold' : 'text-gray-300',
  }
  return (
    <button
      onClick={() => !disabled && onChange(!active)}
      disabled={disabled}
      className={`text-xs transition ${colors[color]} ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:opacity-70'}`}
    >
      {label}
    </button>
  )
}

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [testEmailStatus, setTestEmailStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  const myId = (session?.user as any)?.id

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return }
    if (status === 'authenticated' && !(session?.user as any)?.isAdmin) {
      router.push('/dashboard')
      return
    }
    if (status === 'authenticated') {
      fetch('/api/admin/users')
        .then(r => r.json())
        .then(data => { setUsers(data); setLoading(false) })
        .catch(() => setLoading(false))
    }
  }, [status, session, router])

  const updateRole = async (userId: string, patch: Partial<Pick<User, 'isCoach' | 'isAthlete' | 'isAdmin'>>) => {
    setSaving(userId)
    try {
      const user = users.find(u => u.id === userId)!
      const updated = { ...user, ...patch }
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isCoach: updated.isCoach,
          isAthlete: updated.isAthlete,
          isAdmin: updated.isAdmin,
        })
      })
      if (res.ok) {
        const saved = await res.json()
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...saved } : u))
      }
    } finally {
      setSaving(null)
    }
  }

  const deleteUser = async (userId: string) => {
    setSaving(userId)
    setConfirmDelete(null)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' })
      if (res.ok) {
        setUsers(prev => prev.filter(u => u.id !== userId))
      }
    } finally {
      setSaving(null)
    }
  }

  const filtered = users.filter(u =>
    [u.name, u.email, u.clubName, u.discipline, u.role].some(v =>
      v?.toLowerCase().includes(search.toLowerCase())
    )
  )

  const sendTestEmail = async () => {
    setTestEmailStatus('sending')
    try {
      const res = await fetch('/api/admin/test-email', { method: 'POST' })
      setTestEmailStatus(res.ok ? 'sent' : 'error')
      setTimeout(() => setTestEmailStatus('idle'), 4000)
    } catch {
      setTestEmailStatus('error')
      setTimeout(() => setTestEmailStatus('idle'), 4000)
    }
  }

  const coaches = users.filter(u => u.isCoach).length
  const athletes = users.filter(u => u.isAthlete).length

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 lg:ml-64 min-w-0">
        <div className="px-4 lg:px-8 py-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Admin — All Users</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-medium">{coaches} coaches</span>
            <span className="text-sm bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-medium">{athletes} athletes</span>
            <span className="text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-medium">{users.length} total</span>
            <button
              onClick={sendTestEmail}
              disabled={testEmailStatus === 'sending'}
              className="text-sm px-3 py-1 rounded-full font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition cursor-pointer disabled:opacity-50"
            >
              {testEmailStatus === 'sending' ? 'Sending…' : testEmailStatus === 'sent' ? '✓ Email sent' : testEmailStatus === 'error' ? 'Failed' : 'Send test email'}
            </button>
          </div>
        </div>

        <div className="px-4 lg:px-8 pb-4">
          <LatestActivityCard />
        </div>

        <div className="px-4 lg:px-8 pb-8">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <input
                type="text"
                placeholder="Search by name, email, club or discipline..."
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {loading ? (
              <div className="p-12 text-center text-gray-400">Loading users...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Name</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Email</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Roles</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Club</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Discipline</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Joined</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.map(user => (
                      <tr key={user.id} className={`hover:bg-gray-50 transition ${saving === user.id ? 'opacity-60' : ''}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-xs flex-shrink-0">
                              {user.name?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <span className="font-medium text-gray-900">{user.name || '—'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{user.email}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <RoleToggle
                              label="Coach"
                              active={user.isCoach}
                              color="purple"
                              onChange={val => updateRole(user.id, { isCoach: val })}
                            />
                            <RoleToggle
                              label="Athlete"
                              active={user.isAthlete}
                              color="orange"
                              onChange={val => updateRole(user.id, { isAthlete: val })}
                            />
                            <RoleToggle
                              label="Admin"
                              active={user.isAdmin}
                              color="yellow"
                              disabled={user.id === myId}
                              onChange={val => updateRole(user.id, { isAdmin: val })}
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{user.clubName || '—'}</td>
                        <td className="px-4 py-3 text-gray-600">{user.discipline || '—'}</td>
                        <td className="px-4 py-3 text-gray-400">
                          {new Date(user.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {user.id !== myId && (
                            confirmDelete === user.id ? (
                              <div className="flex items-center gap-2 justify-end">
                                <span className="text-xs text-gray-500">Delete?</span>
                                <button
                                  onClick={() => deleteUser(user.id)}
                                  className="text-xs text-red-600 font-semibold hover:text-red-700 cursor-pointer"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => setConfirmDelete(null)}
                                  className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setConfirmDelete(user.id)}
                                className="text-gray-300 hover:text-red-500 transition cursor-pointer"
                                title="Delete user"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                </svg>
                              </button>
                            )
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filtered.length === 0 && (
                  <div className="p-8 text-center text-gray-400">No users match your search</div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
