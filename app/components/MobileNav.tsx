'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import LogoIcon from './logo.svg'
import Image from 'next/image'

function isActive(pathname: string, href: string) {
  if (href === '/dashboard' || href === '/athletes/dashboard') return pathname === href
  if (href === '/athletes') return pathname === '/athletes' || (
    pathname.startsWith('/athletes/') &&
    !pathname.startsWith('/athletes/dashboard') &&
    !pathname.startsWith('/athletes/schedule') &&
    !pathname.startsWith('/athletes/groups')
  )
  return pathname.startsWith(href)
}

function getPageTitle(pathname: string) {
  if (pathname === '/dashboard' || pathname === '/athletes/dashboard') return 'Dashboard'
  if (pathname === '/workouts') return 'Workouts'
  if (pathname.startsWith('/workouts/new')) return 'New Workout'
  if (pathname.match(/\/workouts\/.+\/edit/)) return 'Edit Workout'
  if (pathname.match(/\/workouts\/.+/)) return 'Workout'
  if (pathname === '/athletes') return 'Athletes'
  if (pathname.match(/\/athletes\/groups\/.+/)) return 'Group'
  if (pathname.match(/\/athletes\/.+/) && !pathname.startsWith('/athletes/dashboard') && !pathname.startsWith('/athletes/schedule')) return 'Athlete'
  if (pathname === '/groups' || pathname.startsWith('/groups/')) return 'Groups'
  if (pathname === '/schedule' || pathname === '/athletes/schedule') return 'Schedule'
  if (pathname === '/profile' || pathname === '/athlete/profile') return 'My Profile'
  if (pathname === '/admin') return 'Admin'
  if (pathname === '/integrations') return 'Integrations'
  return 'Structur'
}

// ── Icons (filled = active, stroke = inactive) ────────────────────────────────

function HomeIcon({ active }: { active: boolean }) {
  if (active) return (
    <svg className="w-[22px] h-[22px] text-indigo-600" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" />
      <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z" />
    </svg>
  )
  return (
    <svg className="w-[22px] h-[22px] text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  )
}

function WorkoutsIcon({ active }: { active: boolean }) {
  if (active) return (
    <svg className="w-[22px] h-[22px] text-indigo-600" viewBox="0 0 24 24" fill="currentColor">
      <path fillRule="evenodd" d="M7.502 6h7.128A3.375 3.375 0 0118 9.375v9.375a3 3 0 003-3V6.108c0-1.505-1.125-2.811-2.664-2.94a48.972 48.972 0 00-.673-.05A3 3 0 0015 1.5h-1.5a3 3 0 00-2.663 1.618c-.225.015-.45.032-.673.05C8.662 3.295 7.554 4.542 7.502 6zM13.5 3A1.5 1.5 0 0012 4.5h4.5A1.5 1.5 0 0015 3h-1.5z" clipRule="evenodd" />
      <path fillRule="evenodd" d="M3 9.375C3 8.339 3.84 7.5 4.875 7.5h9.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-9.75A1.875 1.875 0 013 20.625V9.375zm9.586 4.594a.75.75 0 00-1.172-.938l-2.476 3.096-.908-.907a.75.75 0 00-1.06 1.06l1.5 1.5a.75.75 0 001.116-.062l3-3.75z" clipRule="evenodd" />
    </svg>
  )
  return (
    <svg className="w-[22px] h-[22px] text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
    </svg>
  )
}

function AthletesIcon({ active }: { active: boolean }) {
  if (active) return (
    <svg className="w-[22px] h-[22px] text-indigo-600" viewBox="0 0 24 24" fill="currentColor">
      <path d="M4.5 6.375a4.125 4.125 0 118.25 0 4.125 4.125 0 01-8.25 0zM14.25 8.625a3.375 3.375 0 116.75 0 3.375 3.375 0 01-6.75 0zM1.5 19.125a7.125 7.125 0 0114.25 0v.003l-.001.119a.75.75 0 01-.363.63 13.067 13.067 0 01-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 01-.364-.63l-.001-.122zM17.25 19.128l-.001.144a2.25 2.25 0 01-.233.96 10.088 10.088 0 005.06-1.01.75.75 0 00.42-.643 4.875 4.875 0 00-6.957-4.611 8.586 8.586 0 011.71 5.157v.003z" />
    </svg>
  )
  return (
    <svg className="w-[22px] h-[22px] text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  )
}

function ScheduleIcon({ active }: { active: boolean }) {
  if (active) return (
    <svg className="w-[22px] h-[22px] text-indigo-600" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.75 12.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM7.5 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM8.25 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM9.75 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM10.5 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM12.75 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM14.25 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM15 17.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM16.5 15.75a.75.75 0 100-1.5.75.75 0 000 1.5zM15 12.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM16.5 13.5a.75.75 0 100-1.5.75.75 0 000 1.5z" />
      <path fillRule="evenodd" d="M6.75 2.25A.75.75 0 017.5 3v1.5h9V3A.75.75 0 0118 3v1.5h.75a3 3 0 013 3v11.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V7.5a3 3 0 013-3H6V3a.75.75 0 01.75-.75zm13.5 9a1.5 1.5 0 00-1.5-1.5H5.25a1.5 1.5 0 00-1.5 1.5v7.5a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5v-7.5z" clipRule="evenodd" />
    </svg>
  )
  return (
    <svg className="w-[22px] h-[22px] text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  )
}

function ProfileIcon({ active }: { active: boolean }) {
  if (active) return (
    <svg className="w-[22px] h-[22px] text-indigo-600" viewBox="0 0 24 24" fill="currentColor">
      <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
    </svg>
  )
  return (
    <svg className="w-[22px] h-[22px] text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  )
}

function GroupsIcon({ active }: { active: boolean }) {
  if (active) return (
    <svg className="w-[22px] h-[22px] text-indigo-600" viewBox="0 0 24 24" fill="currentColor">
      <path fillRule="evenodd" d="M8.25 6.75a3.75 3.75 0 117.5 0 3.75 3.75 0 01-7.5 0zM15.75 9.75a3 3 0 116 0 3 3 0 01-6 0zM2.25 9.75a3 3 0 116 0 3 3 0 01-6 0zM6.31 15.117A6.745 6.745 0 0112 12a6.745 6.745 0 016.709 7.498.75.75 0 01-.372.568A12.696 12.696 0 0112 21.75c-2.305 0-4.47-.612-6.337-1.684a.75.75 0 01-.372-.568 6.787 6.787 0 011.019-4.38z" clipRule="evenodd" />
      <path d="M5.082 14.254a8.287 8.287 0 00-1.308 5.135 9.687 9.687 0 01-1.764-.44l-.115-.04a.563.563 0 01-.373-.487l-.01-.121a3.75 3.75 0 013.57-4.047zM20.226 19.389a8.287 8.287 0 00-1.308-5.135 3.75 3.75 0 013.57 4.047l-.01.121a.563.563 0 01-.373.486l-.115.04c-.567.2-1.156.349-1.764.441z" />
    </svg>
  )
  return (
    <svg className="w-[22px] h-[22px] text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
    </svg>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function MobileNav() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [profilePicture, setProfilePicture] = useState<string | null>(null)

  const role = (session?.user as any)?.role || 'coach'
  const isAthlete = role === 'athlete'
  const displayName = session?.user?.name || session?.user?.email || 'U'
  const profileHref = isAthlete ? '/athlete/profile' : '/profile'

  useEffect(() => {
    if (session?.user?.email) {
      fetch('/api/profile')
        .then(r => r.json())
        .then(d => setProfilePicture(d.profilePicture || null))
        .catch(() => {})
    }
  }, [session?.user?.email])

  const coachNav = [
    { href: '/dashboard', label: 'Home', Icon: HomeIcon },
    { href: '/workouts', label: 'Workouts', Icon: WorkoutsIcon },
    { href: '/athletes', label: 'Athletes', Icon: AthletesIcon },
    { href: '/groups', label: 'Groups', Icon: GroupsIcon },
    { href: '/schedule', label: 'Schedule', Icon: ScheduleIcon },
  ]

  const athleteNav = [
    { href: '/athletes/dashboard', label: 'Home', Icon: HomeIcon },
    { href: '/athletes/schedule', label: 'Schedule', Icon: ScheduleIcon },
    { href: '/athlete/profile', label: 'Profile', Icon: ProfileIcon },
  ]

  const nav = isAthlete ? athleteNav : coachNav

  return (
    <>
      {/* ── Mobile top bar ── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-white/95 backdrop-blur-sm border-b border-gray-100 flex items-center px-4 gap-3">
        <div className="relative w-8 h-8 flex-shrink-0 -ml-1">
          <Image src={LogoIcon} alt="Structur" fill className="object-contain" style={{ mixBlendMode: 'multiply' }} priority />
        </div>
        <span className="flex-1 font-bold text-gray-900 text-[15px] tracking-tight">
          {getPageTitle(pathname)}
        </span>
        <Link href={profileHref} className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center overflow-hidden flex-shrink-0 ring-2 ring-indigo-100">
          {profilePicture
            ? <img src={profilePicture} alt="" className="w-full h-full object-cover" />
            : <span className="text-white font-bold text-sm">{displayName.charAt(0).toUpperCase()}</span>
          }
        </Link>
      </div>

      {/* ── Floating bottom pill nav ── */}
      <div
        className="lg:hidden fixed left-4 right-4 z-40"
        style={{ bottom: 'max(16px, env(safe-area-inset-bottom))' }}
      >
        <nav className="bg-white rounded-full shadow-2xl shadow-black/15 border border-gray-100 flex items-center justify-around px-1 py-1.5">
          {nav.map(({ href, label, Icon }) => {
            const active = isActive(pathname, href)
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-full transition-all ${
                  active ? 'bg-indigo-50' : ''
                }`}
              >
                <Icon active={active} />
                <span className={`text-[10px] font-semibold leading-none ${
                  active ? 'text-indigo-600' : 'text-gray-400'
                }`}>
                  {label}
                </span>
              </Link>
            )
          })}
        </nav>
      </div>

    </>
  )
}
