'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Sidebar from '@/app/components/Sidebar'

type Group = {
  id: string
  name: string
  description: string | null
  createdAt: string
  members: GroupMember[]
  _count: {
    workouts: number
  }
}

type GroupMember = {
  id: string
  athlete: {
    id: string
    name: string | null
    email: string
  }
  joinedAt: string
}

type ExistingAthlete = {
  id: string
  name: string | null
  email: string
  profilePicture: string | null
  groups: { id: string; name: string }[]
}

export default function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [groupId, setGroupId] = useState<string | null>(null)
  const [group, setGroup] = useState<Group | null>(null)
  const [loading, setLoading] = useState(true)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteTab, setInviteTab] = useState<'existing' | 'new'>('existing')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [existingAthletes, setExistingAthletes] = useState<ExistingAthlete[]>([])
  const [athleteSearch, setAthleteSearch] = useState('')
  const [addingId, setAddingId] = useState<string | null>(null)

  useEffect(() => {
    async function getGroupId() {
      const resolvedParams = await params
      setGroupId(resolvedParams.id)
    }
    getGroupId()
  }, [params])

  useEffect(() => {
    if (!groupId) return
    loadGroup()
    fetch('/api/athletes').then(r => r.json()).then(setExistingAthletes).catch(() => {})
  }, [groupId])

  const loadGroup = async () => {
    if (!groupId) return
    
    try {
      const res = await fetch(`/api/groups/${groupId}`)
      if (res.ok) {
        const data = await res.json()
        setGroup(data)
      }
    } catch (error) {
      console.error('Failed to load group:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInviteAthlete = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviteError('')
    setInviting(true)

    try {
      const res = await fetch(`/api/groups/${groupId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          name: inviteName
        })
      })

      if (res.ok) {
        setShowInviteModal(false)
        setInviteEmail('')
        setInviteName('')
        loadGroup()
      } else {
        const data = await res.json()
        setInviteError(data.error || 'Failed to invite athlete')
      }
    } catch (error) {
      setInviteError('Failed to invite athlete')
    } finally {
      setInviting(false)
    }
  }

  const handleAddExisting = async (athleteId: string) => {
    setAddingId(athleteId)
    setInviteError('')
    try {
      const res = await fetch(`/api/groups/${groupId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ athleteId })
      })
      if (res.ok) {
        setShowInviteModal(false)
        setAthleteSearch('')
        loadGroup()
      } else {
        const data = await res.json()
        setInviteError(data.error || 'Failed to add athlete')
      }
    } catch {
      setInviteError('Failed to add athlete')
    } finally {
      setAddingId(null)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Remove this athlete from the group?')) return

    try {
      const res = await fetch(`/api/groups/${groupId}/members/${memberId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        loadGroup()
      }
    } catch (error) {
      console.error('Failed to remove member:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 lg:ml-64 w-full flex items-center justify-center">
          <div className="text-gray-600">Loading...</div>
        </main>
      </div>
    )
  }

  if (!group) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 lg:ml-64 w-full flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Group not found</h1>
            <Link href="/athletes" className="text-indigo-600 hover:underline">
              Back to athletes
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        
        <main className="flex-1 lg:ml-64 w-full">
          {/* Top Bar */}
          <div className="px-4 lg:px-8 py-6">
            <Link 
              href="/athletes"
              className="inline-flex items-center text-indigo-600 hover:text-indigo-700 font-medium mb-2"
            >
              ← Back to athletes
            </Link>
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
                {group.description && (
                  <p className="text-gray-600 mt-1">{group.description}</p>
                )}
              </div>
              <button
                onClick={() => setShowInviteModal(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition"
              >
                <span>+</span>
                Invite Athlete
              </button>
            </div>
          </div>

          <div className="p-4 lg:p-8">
            {/* Group Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="text-sm font-medium text-gray-600 mb-1">Total Athletes</div>
                <div className="text-3xl font-bold text-indigo-600">{group.members.length}</div>
              </div>
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="text-sm font-medium text-gray-600 mb-1">Workouts Assigned</div>
                <div className="text-3xl font-bold text-indigo-600">{group._count.workouts}</div>
              </div>
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="text-sm font-medium text-gray-600 mb-1">Created</div>
                <div className="text-lg font-semibold text-gray-900">
                  {new Date(group.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Athletes List */}
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Athletes</h2>
              </div>

              {group.members.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="text-6xl mb-4">👤</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No athletes yet</h3>
                  <p className="text-gray-600 mb-6">Invite athletes to join this group</p>
                  <button
                    onClick={() => setShowInviteModal(true)}
                    className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition"
                  >
                    Invite Athlete
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {group.members.map((member) => (
                    <div key={member.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                          <span className="text-lg font-semibold text-indigo-600">
                            {member.athlete.name?.charAt(0).toUpperCase() || member.athlete.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <a href={`/athletes/${member.athlete.id}`} className="font-semibold text-gray-900 hover:text-indigo-600 transition">
                            {member.athlete.name || 'Unnamed Athlete'}
                          </a>
                          <div className="text-sm text-gray-600">{member.athlete.email}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            Joined {new Date(member.joinedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Invite Athlete Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full overflow-hidden">
            <div className="p-6 pb-0">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Add Athlete</h3>

              {/* Tabs */}
              <div className="flex border-b border-gray-200 mb-4">
                <button
                  onClick={() => { setInviteTab('existing'); setInviteError('') }}
                  className={`px-4 py-2 text-sm font-semibold border-b-2 transition -mb-px ${inviteTab === 'existing' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                >
                  Existing Athlete
                </button>
                <button
                  onClick={() => { setInviteTab('new'); setInviteError('') }}
                  className={`px-4 py-2 text-sm font-semibold border-b-2 transition -mb-px ${inviteTab === 'new' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                >
                  Invite by Email
                </button>
              </div>
            </div>

            <div className="p-6 pt-0">
              {inviteError && (
                <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">{inviteError}</div>
              )}

              {inviteTab === 'existing' ? (
                <>
                  {(() => {
                    const currentMemberIds = new Set(group.members.map(m => m.athlete.id))
                    const available = existingAthletes.filter(a =>
                      !currentMemberIds.has(a.id) &&
                      (a.name?.toLowerCase().includes(athleteSearch.toLowerCase()) ||
                       a.email.toLowerCase().includes(athleteSearch.toLowerCase()))
                    )
                    return (
                      <>
                        <input
                          autoFocus
                          type="text"
                          placeholder="Search athletes..."
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent mb-3"
                          value={athleteSearch}
                          onChange={e => setAthleteSearch(e.target.value)}
                        />
                        <ul className="max-h-64 overflow-y-auto divide-y divide-gray-50 rounded-lg border border-gray-100">
                          {available.length === 0 ? (
                            <li className="px-4 py-6 text-center text-sm text-gray-400">
                              {existingAthletes.length === 0 ? 'No athletes in your roster yet' : 'All your athletes are already in this group'}
                            </li>
                          ) : available.map(a => (
                            <li key={a.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full overflow-hidden bg-orange-100 flex-shrink-0 flex items-center justify-center ring-2 ring-yellow-400">
                                  {a.profilePicture
                                    ? <img src={a.profilePicture} alt="" className="w-full h-full object-cover" />
                                    : <span className="text-xs font-bold text-orange-600">{(a.name || a.email).charAt(0).toUpperCase()}</span>
                                  }
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{a.name || a.email}</div>
                                  {a.name && <div className="text-xs text-gray-400">{a.email}</div>}
                                </div>
                              </div>
                              <button
                                onClick={() => handleAddExisting(a.id)}
                                disabled={addingId === a.id}
                                className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 disabled:opacity-50 cursor-pointer"
                              >
                                {addingId === a.id ? 'Adding…' : 'Add'}
                              </button>
                            </li>
                          ))}
                        </ul>
                        <button
                          onClick={() => { setShowInviteModal(false); setAthleteSearch(''); setInviteError('') }}
                          className="w-full mt-4 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
                        >
                          Cancel
                        </button>
                      </>
                    )
                  })()}
                </>
              ) : (
                <form onSubmit={handleInviteAthlete}>
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                      <input
                        type="email"
                        required
                        autoFocus
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="athlete@example.com"
                        value={inviteEmail}
                        onChange={e => setInviteEmail(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name (optional)</label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Athlete name"
                        value={inviteName}
                        onChange={e => setInviteName(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => { setShowInviteModal(false); setInviteEmail(''); setInviteName(''); setInviteError('') }}
                      disabled={inviting}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={inviting}
                      className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition disabled:opacity-50"
                    >
                      {inviting ? 'Sending…' : 'Send Invite'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}