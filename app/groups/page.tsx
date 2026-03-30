'use client'

import { useEffect, useState } from 'react'
import Sidebar from '@/app/components/Sidebar'
import Link from 'next/link'

type Group = {
  id: string
  name: string
  description: string | null
  createdAt: string
  _count: { members: number }
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupDescription, setNewGroupDescription] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    loadGroups()
  }, [])

  const loadGroups = async () => {
    try {
      const res = await fetch('/api/groups')
      if (res.ok) setGroups(await res.json())
    } catch (error) {
      console.error('Failed to load groups:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newGroupName, description: newGroupDescription })
      })
      if (res.ok) {
        setShowCreateModal(false)
        setNewGroupName('')
        setNewGroupDescription('')
        loadGroups()
      }
    } catch (error) {
      console.error('Failed to create group:', error)
    } finally {
      setCreating(false)
    }
  }

  return (
    <>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />

        <main className="flex-1 lg:ml-64 min-w-0">
          <div className="px-4 lg:px-8 py-6 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900 hidden lg:block">Training Groups</h1>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition"
            >
              <span>+</span>
              New Group
            </button>
          </div>

          <div className="px-4 lg:px-8 pb-8">
            {loading ? (
              <div className="text-center py-12 text-gray-400">Loading...</div>
            ) : groups.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center border-2 border-dashed border-gray-300">
                <div className="text-6xl mb-4">👥</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No groups yet</h3>
                <p className="text-gray-600 mb-6">Create your first training group to get started</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition"
                >
                  Create Group
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groups.map((group) => (
                  <Link
                    key={group.id}
                    href={`/athletes/groups/${group.id}`}
                    className="bg-white rounded-xl p-6 border border-gray-200 hover:border-indigo-400 hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <span className="text-sm text-gray-400 font-medium">
                        {group._count.members} {group._count.members === 1 ? 'athlete' : 'athletes'}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{group.name}</h3>
                    {group.description && (
                      <p className="text-gray-500 text-sm line-clamp-2">{group.description}</p>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Create New Group</h3>
            <form onSubmit={handleCreateGroup}>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Group Name *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="e.g. Marathon Training"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
                  <textarea
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Add a description..."
                    rows={3}
                    value={newGroupDescription}
                    onChange={(e) => setNewGroupDescription(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); setNewGroupName(''); setNewGroupDescription('') }}
                  disabled={creating}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
