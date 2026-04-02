'use client'

import { useEffect, useState } from 'react'
import Sidebar from '@/app/components/Sidebar'
import Link from 'next/link'

type Group = {
  id: string
  name: string
  description: string | null
  raceName: string | null
  raceDate: string | null
  createdAt: string
  _count: { members: number }
}

type GroupFormState = {
  name: string
  description: string
  raceName: string
  raceDate: string
}

const emptyForm: GroupFormState = { name: '', description: '', raceName: '', raceDate: '' }

function isArchived(group: Group): boolean {
  if (!group.raceDate) return false
  return new Date(group.raceDate) < new Date()
}

function daysUntilRace(raceDate: string): number {
  const diff = new Date(raceDate).getTime() - new Date().setHours(0, 0, 0, 0)
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function GroupCard({ group, onEdit }: { group: Group; onEdit: (g: Group) => void }) {
  const archived = isArchived(group)
  const days = group.raceDate && !archived ? daysUntilRace(group.raceDate) : null

  return (
    <div className={`bg-white rounded-xl border transition group/card relative ${archived ? 'border-gray-200 opacity-70' : 'border-gray-200 hover:border-indigo-400 hover:shadow-md'}`}>
      {/* Edit button */}
      <button
        onClick={(e) => { e.preventDefault(); onEdit(group) }}
        className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition opacity-0 group-hover/card:opacity-100"
        title="Edit group"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 0l.172.172a2 2 0 010 2.828L12 16H9v-3z" />
        </svg>
      </button>

      <Link href={`/athletes/groups/${group.id}`} className="block p-6">
        <div className="flex items-start gap-3 mb-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${archived ? 'bg-gray-100' : 'bg-indigo-100'}`}>
            <svg className={`w-5 h-5 ${archived ? 'text-gray-400' : 'text-indigo-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0 pr-4">
            <h3 className="text-base font-semibold text-gray-900 truncate">{group.name}</h3>
            <p className="text-xs text-gray-400 mt-0.5">{group._count.members} {group._count.members === 1 ? 'athlete' : 'athletes'}</p>
          </div>
        </div>

        {group.description && (
          <p className="text-gray-500 text-sm line-clamp-2 mb-3">{group.description}</p>
        )}

        {group.raceName || group.raceDate ? (
          <div className={`mt-2 rounded-lg px-3 py-2 ${archived ? 'bg-gray-50' : 'bg-orange-50'}`}>
            {group.raceName && (
              <div className={`text-xs font-semibold ${archived ? 'text-gray-500' : 'text-orange-700'}`}>{group.raceName}</div>
            )}
            {group.raceDate && (
              <div className={`text-xs mt-0.5 ${archived ? 'text-gray-400' : 'text-orange-600'}`}>
                {new Date(group.raceDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                {days !== null && (
                  <span className="ml-1 font-medium">· {days === 0 ? 'Race day!' : `${days}d to go`}</span>
                )}
                {archived && <span className="ml-1 text-gray-400">(completed)</span>}
              </div>
            )}
          </div>
        ) : null}
      </Link>
    </div>
  )
}

function GroupForm({
  form,
  setForm,
  saving,
  onClose,
  onSubmit,
  submitLabel,
}: {
  form: GroupFormState
  setForm: React.Dispatch<React.SetStateAction<GroupFormState>>
  saving: boolean
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
  submitLabel: string
}) {
  return (
    <form onSubmit={onSubmit}>
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Group Name *</label>
          <input
            type="text"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="e.g. Spring Marathon Squad"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
          <textarea
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Add a description..."
            rows={2}
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          />
        </div>
        <div className="border-t border-gray-100 pt-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Race / Event</p>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Event Name (optional)</label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="e.g. London Marathon 2026"
                value={form.raceName}
                onChange={e => setForm(f => ({ ...f, raceName: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Race Date (optional)</label>
              <input
                type="date"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                value={form.raceDate}
                onChange={e => setForm(f => ({ ...f, raceDate: e.target.value }))}
              />
              <p className="text-xs text-gray-400 mt-1">Group moves to archive after this date</p>
            </div>
          </div>
        </div>
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition disabled:opacity-50"
        >
          {saving ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  )
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingGroup, setEditingGroup] = useState<Group | null>(null)
  const [form, setForm] = useState<GroupFormState>(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadGroups() }, [])

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

  const openCreate = () => {
    setForm(emptyForm)
    setShowCreateModal(true)
  }

  const openEdit = (group: Group) => {
    setEditingGroup(group)
    setForm({
      name: group.name,
      description: group.description ?? '',
      raceName: group.raceName ?? '',
      raceDate: group.raceDate ? group.raceDate.slice(0, 10) : '',
    })
  }

  const closeModals = () => {
    setShowCreateModal(false)
    setEditingGroup(null)
    setForm(emptyForm)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      if (res.ok) { closeModals(); loadGroups() }
    } catch (error) {
      console.error('Failed to create group:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingGroup) return
    setSaving(true)
    try {
      const res = await fetch(`/api/groups/${editingGroup.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      if (res.ok) { closeModals(); loadGroups() }
    } catch (error) {
      console.error('Failed to update group:', error)
    } finally {
      setSaving(false)
    }
  }

  const active = groups.filter(g => !isArchived(g))
  const archived = groups.filter(g => isArchived(g))

  return (
    <>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />

        <main className="flex-1 lg:ml-64 min-w-0">
          <div className="px-4 lg:px-8 py-6 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900 hidden lg:block">Training Groups</h1>
            <button
              onClick={openCreate}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition"
            >
              <span>+</span>
              New Group
            </button>
          </div>

          <div className="px-4 lg:px-8 pb-8 space-y-8">
            {loading ? (
              <div className="text-center py-12 text-gray-400">Loading...</div>
            ) : groups.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center border-2 border-dashed border-gray-300">
                <div className="text-6xl mb-4">👥</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No groups yet</h3>
                <p className="text-gray-600 mb-6">Create your first training group to get started</p>
                <button
                  onClick={openCreate}
                  className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition"
                >
                  Create Group
                </button>
              </div>
            ) : (
              <>
                {/* Active groups */}
                {active.length > 0 && (
                  <div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {active.map(group => (
                        <GroupCard key={group.id} group={group} onEdit={openEdit} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Archived groups */}
                {archived.length > 0 && (
                  <div>
                    <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                      </svg>
                      Archive
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {archived.map(group => (
                        <GroupCard key={group.id} group={group} onEdit={openEdit} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Create New Group</h3>
            <GroupForm form={form} setForm={setForm} saving={saving} onClose={closeModals} onSubmit={handleCreate} submitLabel="Create Group" />
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Edit Group</h3>
            <GroupForm form={form} setForm={setForm} saving={saving} onClose={closeModals} onSubmit={handleEdit} submitLabel="Save Changes" />
          </div>
        </div>
      )}
    </>
  )
}
