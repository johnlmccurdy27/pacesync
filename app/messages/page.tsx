'use client'

import { useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import Sidebar from '@/app/components/Sidebar'

type UserSummary = { id: string; name: string | null; email: string; profilePicture: string | null }

type Message = {
  id: string
  body: string
  createdAt: string
  readAt: string | null
  sender: { id: string; name: string | null; profilePicture: string | null }
}

type Thread = {
  id: string
  coach: UserSummary
  athlete: UserSummary
  messages: Message[]
}

type ThreadMeta = { id: string; athlete: UserSummary; unreadCount: number; lastMessageAt: string }
type CoachEntry = { coach: UserSummary; threadId: string | null; unreadCount: number }

function Avatar({ user, size = 8 }: { user: { name: string | null; email: string; profilePicture: string | null }; size?: number }) {
  const [imgError, setImgError] = useState(false)
  const initials = (user.name || user.email).charAt(0).toUpperCase()
  const s = `w-${size} h-${size}`
  return (user.profilePicture && !imgError)
    ? <img src={user.profilePicture} alt="" className={`${s} rounded-full object-cover flex-shrink-0`} onError={() => setImgError(true)} />
    : <div className={`${s} rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0`}>
        <span className="text-indigo-700 font-bold text-xs">{initials}</span>
      </div>
}

function ThreadView({
  thread,
  currentUserId,
  onSend,
  sending,
  onBack,
}: {
  thread: Thread
  currentUserId: string
  onSend: (body: string) => void
  sending: boolean
  onBack?: () => void
}) {
  const [body, setBody] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [thread.messages])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!body.trim() || sending) return
    onSend(body.trim())
    setBody('')
  }

  const other = thread.coach.id === currentUserId ? thread.athlete : thread.coach

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3 flex-shrink-0">
        {onBack && (
          <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition text-gray-500 flex-shrink-0 -ml-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        <Avatar user={other} size={8} />
        <div className="min-w-0">
          <div className="font-semibold text-gray-900 text-sm truncate">{other.name || other.email}</div>
          <div className="text-xs text-gray-400 truncate">{other.email}</div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {thread.messages.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-8">No messages yet. Say hello!</p>
        )}
        {thread.messages.map(msg => {
          const isMine = msg.sender.id === currentUserId
          return (
            <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} gap-2 items-end`}>
              {!isMine && <Avatar user={msg.sender as any} size={6} />}
              <div className="max-w-[78%] lg:max-w-[65%]">
                <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  isMine ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                }`}>
                  {msg.body}
                </div>
                <div className={`text-[10px] text-gray-400 mt-1 ${isMine ? 'text-right' : 'text-left'}`}>
                  {new Date(msg.createdAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              {isMine && <Avatar user={msg.sender as any} size={6} />}
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Reply box */}
      <form onSubmit={submit} className="px-4 py-3 border-t border-gray-100 flex gap-2 flex-shrink-0" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
        <input
          type="text"
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="Write a message..."
          className="flex-1 px-4 py-2.5 border border-gray-200 rounded-full text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
        <button
          type="submit"
          disabled={!body.trim() || sending}
          className="w-10 h-10 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white rounded-full transition disabled:opacity-50 flex-shrink-0"
        >
          <svg className="w-4 h-4 -rotate-45" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
          </svg>
        </button>
      </form>
    </div>
  )
}

function ComposeFirst({
  entry,
  onSend,
  sending,
  onBack,
}: {
  entry: CoachEntry
  onSend: (body: string) => void
  sending: boolean
  onBack?: () => void
}) {
  const [body, setBody] = useState('')
  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3 flex-shrink-0">
        {onBack && (
          <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition text-gray-500 flex-shrink-0 -ml-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        <Avatar user={entry.coach} size={8} />
        <div>
          <div className="font-semibold text-gray-900 text-sm">{entry.coach.name || entry.coach.email}</div>
          <div className="text-xs text-gray-400">Your coach</div>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center px-6 text-center">
        <p className="text-gray-400 text-sm">Send your first message to your coach</p>
      </div>
      <form
        onSubmit={async e => { e.preventDefault(); if (!body.trim()) return; await onSend(body.trim()); setBody('') }}
        className="px-4 py-3 border-t border-gray-100 flex gap-2 flex-shrink-0"
        style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
      >
        <input
          type="text"
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="Write a message..."
          className="flex-1 px-4 py-2.5 border border-gray-200 rounded-full text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
        <button type="submit" disabled={sending || !body.trim()} className="w-10 h-10 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white rounded-full transition disabled:opacity-50 flex-shrink-0">
          <svg className="w-4 h-4 -rotate-45" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
          </svg>
        </button>
      </form>
    </div>
  )
}

export default function MessagesPage() {
  const { data: session } = useSession()
  const currentUserId = (session?.user as any)?.id as string
  const isAthlete = (session?.user as any)?.role === 'athlete'

  // Coach state
  const [threads, setThreads] = useState<ThreadMeta[]>([])
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null)
  const [athletes, setAthletes] = useState<UserSummary[]>([])
  const [showCompose, setShowCompose] = useState(false)

  // Athlete state
  const [coaches, setCoaches] = useState<CoachEntry[]>([])
  const [selectedCoach, setSelectedCoach] = useState<CoachEntry | null>(null)

  // Shared
  const [activeThread, setActiveThread] = useState<Thread | null>(null)
  const [loadingThread, setLoadingThread] = useState(false)
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)

  // Mobile: 'list' shows inbox/coach list, 'thread' shows the open conversation
  const [mobileView, setMobileView] = useState<'list' | 'thread'>('list')

  const displayName = (session?.user as any)?.name || session?.user?.email || ''

  useEffect(() => {
    fetch('/api/messages')
      .then(r => r.json())
      .then(data => {
        if (data.role === 'coach') {
          const threadList: ThreadMeta[] = data.threads || []
          setThreads(threadList)
          // On desktop, auto-open first thread
          if (threadList.length > 0 && window.innerWidth >= 1024) selectThread(threadList[0].id)
          fetch('/api/groups')
            .then(r => r.json())
            .then(async (groups: any[]) => {
              if (!Array.isArray(groups)) return
              const members: UserSummary[] = []
              const seen = new Set<string>()
              for (const g of groups) {
                const res = await fetch(`/api/groups/${g.id}`)
                if (!res.ok) continue
                const detail = await res.json()
                for (const m of (detail.members || [])) {
                  if (!seen.has(m.athlete.id) && m.athlete.id !== (session?.user as any)?.id) {
                    seen.add(m.athlete.id)
                    members.push(m.athlete)
                  }
                }
              }
              setAthletes(members)
            })
            .catch(() => {})
        } else if (data.role === 'athlete') {
          const coachList: CoachEntry[] = data.coaches || []
          setCoaches(coachList)
          if (coachList.length === 1) {
            openCoachThread(coachList[0])
            setMobileView('thread')
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const selectThread = async (threadId: string) => {
    setSelectedThreadId(threadId)
    setLoadingThread(true)
    setShowCompose(false)
    setMobileView('thread')
    try {
      const res = await fetch(`/api/messages/${threadId}`)
      if (res.ok) {
        const thread = await res.json()
        setActiveThread(thread)
        setThreads(prev => prev.map(t => t.id === threadId ? { ...t, unreadCount: 0 } : t))
      }
    } finally {
      setLoadingThread(false)
    }
  }

  const openCoachThread = async (entry: CoachEntry) => {
    setSelectedCoach(entry)
    setMobileView('thread')
    if (entry.threadId) {
      setLoadingThread(true)
      try {
        const res = await fetch(`/api/messages/${entry.threadId}`)
        if (res.ok) setActiveThread(await res.json())
      } finally {
        setLoadingThread(false)
      }
    } else {
      setActiveThread(null)
    }
  }

  const startThreadWithAthlete = async (athlete: UserSummary) => {
    setShowCompose(false)
    setLoadingThread(true)
    setMobileView('thread')
    try {
      const res = await fetch('/api/messages/thread', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ athleteId: athlete.id }),
      })
      if (res.ok) {
        const { threadId } = await res.json()
        setThreads(prev => {
          if (prev.find(t => t.id === threadId)) return prev
          return [{ id: threadId, athlete, unreadCount: 0, lastMessageAt: new Date().toISOString() }, ...prev]
        })
        await selectThread(threadId)
      }
    } finally {
      setLoadingThread(false)
    }
  }

  const ensureThread = async (): Promise<string | null> => {
    if (activeThread) return activeThread.id
    if (!isAthlete || !selectedCoach) return null
    const res = await fetch('/api/messages/thread', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ coachId: selectedCoach.coach.id }),
    })
    if (!res.ok) return null
    const { threadId } = await res.json()
    setCoaches(prev => prev.map(c => c.coach.id === selectedCoach.coach.id ? { ...c, threadId } : c))
    setSelectedCoach(prev => prev ? { ...prev, threadId } : prev)
    return threadId
  }

  const handleSend = async (body: string) => {
    setSending(true)
    try {
      const threadId = await ensureThread()
      if (!threadId) return
      const res = await fetch(`/api/messages/${threadId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      })
      if (res.ok) {
        const newMsg = await res.json()
        setActiveThread(prev => prev ? { ...prev, messages: [...prev.messages, newMsg] } : null)
        if (!isAthlete) {
          setThreads(prev => {
            const updated = prev.map(t => t.id === threadId ? { ...t, lastMessageAt: newMsg.createdAt } : t)
            return [...updated].sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime())
          })
        }
      }
    } finally {
      setSending(false)
    }
  }

  const goBackToList = () => {
    setMobileView('list')
    setActiveThread(null)
    setSelectedThreadId(null)
    setSelectedCoach(null)
  }

  // Full height accounting for mobile top bar (h-14 = 56px)
  const fullHeight = 'h-[calc(100vh-56px)] lg:h-screen'

  // ── Inbox list (coach, mobile) ──
  const CoachInboxList = () => (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
        <p className="text-sm font-bold text-gray-900 lg:hidden">Messages</p>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider hidden lg:block">Inbox</p>
        <button
          onClick={() => setShowCompose(v => !v)}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition"
          title="New message"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {showCompose && (
        <div className="border-b border-gray-100 px-3 py-2 bg-indigo-50 flex-shrink-0">
          <p className="text-xs font-semibold text-gray-500 mb-2">Message an athlete:</p>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {athletes.length === 0 && <p className="text-xs text-gray-400 py-2">No athletes found</p>}
            {athletes.map(a => (
              <button key={a.id} onClick={() => startThreadWithAthlete(a)} className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white transition text-left">
                <Avatar user={a} size={7} />
                <span className="text-sm text-gray-800 truncate">{a.name || a.email}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {threads.length === 0 && !showCompose ? (
        <div className="flex-1 flex items-center justify-center p-6 text-center">
          <p className="text-gray-400 text-sm">No messages yet. Tap + to start a conversation.</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {threads.map(t => (
            <button
              key={t.id}
              onClick={() => selectThread(t.id)}
              className={`w-full flex items-center gap-3 px-4 py-5 hover:bg-gray-50 transition text-left border-b border-gray-100 ${selectedThreadId === t.id ? 'bg-indigo-50 border-l-2 border-l-indigo-500' : ''}`}
            >
              <Avatar user={t.athlete} size={10} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-900 truncate">{t.athlete.name || t.athlete.email}</div>
                <div className="text-xs text-gray-400 mt-0.5">{new Date(t.lastMessageAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</div>
              </div>
              {t.unreadCount > 0 && (
                <span className="w-5 h-5 bg-indigo-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center flex-shrink-0">{t.unreadCount}</span>
              )}
              <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div className="flex bg-gray-50" style={{ height: '100vh' }}>
      <Sidebar userName={displayName} />

      <main className={`flex-1 lg:ml-64 min-w-0 flex flex-col pt-14 lg:pt-0 ${fullHeight}`}>

        {/* Desktop page title */}
        <div className="px-8 py-6 flex-shrink-0 hidden lg:block">
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        </div>

        <div className="flex-1 lg:px-8 lg:pb-6 min-h-0">
          <div className="bg-white lg:rounded-xl lg:border border-gray-200 flex h-full overflow-hidden">

            {loading ? (
              <div className="flex-1 flex items-center justify-center text-gray-400">Loading...</div>
            ) : isAthlete ? (
              // ── ATHLETE VIEW ──
              !coaches || coaches.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center mb-3">
                    <svg className="w-7 h-7 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                  </div>
                  <p className="text-gray-600 font-medium">No coach yet</p>
                  <p className="text-gray-400 text-sm mt-1">Ask your coach to add you to a training group.</p>
                </div>
              ) : coaches.length === 1 ? (
                // Single coach — full screen thread
                <div className="flex-1 flex flex-col min-h-0">
                  {loadingThread
                    ? <div className="flex-1 flex items-center justify-center text-gray-400">Loading...</div>
                    : activeThread
                      ? <ThreadView thread={activeThread} currentUserId={currentUserId} onSend={handleSend} sending={sending} />
                      : <ComposeFirst entry={coaches[0]} onSend={handleSend} sending={sending} />
                  }
                </div>
              ) : (
                // Multiple coaches — list / thread toggle on mobile
                <>
                  {/* Mobile: coach list */}
                  <div className={`flex-col border-gray-100 lg:border-r lg:flex-none lg:w-64 ${mobileView === 'list' ? 'flex flex-1' : 'hidden lg:flex'}`}>
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-bold text-gray-900 lg:hidden">Messages</p>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider hidden lg:block">Your Coaches</p>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                      {coaches.map(entry => (
                        <button key={entry.coach.id} onClick={() => openCoachThread(entry)} className={`w-full flex items-center gap-3 px-4 py-5 hover:bg-gray-50 transition text-left border-b border-gray-100 ${selectedCoach?.coach.id === entry.coach.id ? 'bg-indigo-50' : ''}`}>
                          <Avatar user={entry.coach} size={10} />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-gray-900 truncate">{entry.coach.name || entry.coach.email}</div>
                            <div className="text-xs text-gray-400 truncate mt-0.5">{entry.coach.email}</div>
                          </div>
                          {entry.unreadCount > 0 && <span className="w-5 h-5 bg-indigo-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center flex-shrink-0">{entry.unreadCount}</span>}
                          <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Mobile: thread view */}
                  <div className={`flex-col min-h-0 ${mobileView === 'thread' ? 'flex flex-1' : 'hidden lg:flex lg:flex-1'}`}>
                    {loadingThread
                      ? <div className="flex-1 flex items-center justify-center text-gray-400">Loading...</div>
                      : activeThread
                        ? <ThreadView thread={activeThread} currentUserId={currentUserId} onSend={handleSend} sending={sending} onBack={goBackToList} />
                        : selectedCoach
                          ? <ComposeFirst entry={selectedCoach} onSend={handleSend} sending={sending} onBack={goBackToList} />
                          : <div className="flex-1 flex items-center justify-center"><p className="text-gray-400 text-sm">Select a coach</p></div>
                    }
                  </div>
                </>
              )
            ) : (
              // ── COACH VIEW ──
              <>
                {/* Inbox list — fixed 288px on desktop, full-width on mobile (toggle) */}
                <div className={`flex-col border-gray-100 lg:border-r lg:flex-none lg:w-72 ${mobileView === 'list' ? 'flex flex-1' : 'hidden lg:flex'}`}>
                  <CoachInboxList />
                </div>

                {/* Thread panel — fills remaining space on desktop, full-width on mobile (toggle) */}
                <div className={`flex-col min-h-0 ${mobileView === 'thread' ? 'flex flex-1' : 'hidden lg:flex lg:flex-1'}`}>
                  {loadingThread ? (
                    <div className="flex-1 flex items-center justify-center text-gray-400">Loading...</div>
                  ) : activeThread ? (
                    <ThreadView thread={activeThread} currentUserId={currentUserId} onSend={handleSend} sending={sending} onBack={goBackToList} />
                  ) : (
                    <div className="flex-1 flex-col items-center justify-center text-center p-12 hidden lg:flex">
                      <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                        </svg>
                      </div>
                      <p className="text-gray-500 font-medium">Select a conversation or click + to start one</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
