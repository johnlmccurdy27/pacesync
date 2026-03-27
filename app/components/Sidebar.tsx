'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import LogoIcon from './logo.svg';
import { APP_VERSION } from '@/lib/version';

export default function Sidebar({ userName }: { userName?: string }) {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { data: session } = useSession()
  const role = session?.user?.role || 'coach'
  const isAthlete = role === 'athlete'
  const isAdmin = (session?.user as any)?.isAdmin === true
  const isCoach = (session?.user as any)?.isCoach === true
  const isAthleteRole = (session?.user as any)?.isAthlete === true
  const displayName = userName || session?.user?.name || session?.user?.email || 'User'
  const [profilePicture, setProfilePicture] = useState<string | null>(null)

  useEffect(() => {
    if (session?.user?.email) {
      fetch('/api/profile')
        .then(r => r.json())
        .then(data => setProfilePicture(data.profilePicture || null))
        .catch(() => {})
    }
  }, [session?.user?.email])

  const isActive = (path: string) => {
    if (path === '/dashboard' || path === '/athletes/dashboard') return pathname === path
    return pathname.startsWith(path)
  }

  const coachNav = [
    { href: '/dashboard', label: 'Dashboard', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /> },
    { href: '/workouts', label: 'Workouts', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /> },
    { href: '/athletes', label: 'Athletes', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /> },
    { href: '/schedule', label: 'Schedule', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /> },
  ]

  const athleteNav = [
    { href: '/athletes/dashboard', label: 'Dashboard', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /> },
    { href: '/athletes/schedule', label: 'My Schedule', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /> },
    { href: '/athlete/profile', label: 'My Profile', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /> },
  ]

  const nav = isAthlete ? athleteNav : coachNav
  const profileHref = isAthlete ? '/athlete/profile' : '/profile'

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-indigo-600 text-white rounded-xl shadow-lg"
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen
          ? <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          : <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
        }
      </button>

      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Sidebar — floating card with rounded corners */}
      <aside
        className={`fixed left-4 top-4 w-56 flex flex-col z-40 transition-transform duration-300 rounded-2xl overflow-hidden shadow-2xl
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-[calc(100%+16px)] lg:translate-x-0'}`}
        style={{
          background: 'linear-gradient(180deg, #3d52d4 0%, #1a1f6e 100%)',
          height: 'calc(100vh - 32px)',
        }}
      >
        {/* Logo */}
        <div className="overflow-hidden flex-shrink-0">
          <Link
            href={isAthlete ? '/athletes/dashboard' : '/dashboard'}
            className="flex justify-center hover:opacity-90 transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <div className="relative w-32 h-32 flex items-center justify-center transform scale-150 -mt-6 -mb-4">
              <Image src={LogoIcon} alt="Logo" width={300} height={300} className="object-contain" priority />
            </div>
          </Link>
        </div>

        {/* Role badges */}
        {(isCoach || isAthleteRole) && (
          <div className="px-4 pb-2 flex items-center justify-center gap-2">
            {isCoach && (
              <div className="bg-orange-500/20 border border-orange-400/40 rounded-full px-3 py-1">
                <span className="text-xs font-bold text-orange-300 uppercase tracking-widest">Coach</span>
              </div>
            )}
            {isAthleteRole && (
              <div className="bg-orange-500/20 border border-orange-400/40 rounded-full px-3 py-1">
                <span className="text-xs font-bold text-orange-300 uppercase tracking-widest">Athlete</span>
              </div>
            )}
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <div className="mb-5">
            <div className="text-xs font-semibold text-indigo-300/70 px-3 mb-2 uppercase tracking-wider">Main</div>
            {nav.map(({ href, label, icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 mb-1 ${
                  isActive(href)
                    ? 'bg-white text-indigo-700 shadow-md font-semibold'
                    : 'text-indigo-200 hover:bg-white/10 font-medium'
                }`}
              >
                <svg className={`w-5 h-5 flex-shrink-0 ${isActive(href) ? 'text-indigo-600' : 'text-indigo-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">{icon}</svg>
                <span>{label}</span>
              </Link>
            ))}
          </div>

          {isAdmin && (
            <div className="mb-5">
              <div className="text-xs font-semibold text-indigo-300/70 px-3 mb-2 uppercase tracking-wider">Admin</div>
              <Link
                href="/admin"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 mb-1 ${
                  isActive('/admin')
                    ? 'bg-white text-indigo-700 shadow-md font-semibold'
                    : 'text-indigo-200 hover:bg-white/10 font-medium'
                }`}
              >
                <svg className={`w-5 h-5 flex-shrink-0 ${isActive('/admin') ? 'text-indigo-600' : 'text-indigo-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>Admin</span>
              </Link>
            </div>
          )}

          <div>
            <div className="text-xs font-semibold text-indigo-300/70 px-3 mb-2 uppercase tracking-wider">Settings</div>
            <Link
              href="/integrations"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 mb-1 ${
                isActive('/integrations')
                  ? 'bg-white text-indigo-700 shadow-md font-semibold'
                  : 'text-indigo-200 hover:bg-white/10 font-medium'
              }`}
            >
              <svg className={`w-5 h-5 flex-shrink-0 ${isActive('/integrations') ? 'text-indigo-600' : 'text-indigo-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Integrations</span>
            </Link>
          </div>
        </nav>

        {/* User section */}
        <div className="p-3 border-t border-white/10">
          <Link
            href={profileHref}
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 transition mb-1"
          >
            <div className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden bg-white/20 flex items-center justify-center ring-2 ring-yellow-400">
              {profilePicture
                ? <img src={profilePicture} alt="" className="w-full h-full object-cover" />
                : <span className="font-bold text-white text-sm">{displayName.charAt(0).toUpperCase()}</span>
              }
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate text-white">{displayName}</div>
              <div className="text-xs text-indigo-300">{isAthlete ? 'Athlete' : 'Head Coach'}</div>
              <div className="text-xs text-indigo-400/60">{APP_VERSION}</div>
            </div>
            <svg className="w-4 h-4 text-indigo-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
          <form action="/api/auth/signout" method="POST">
            <button className="w-full text-left px-3 py-2 rounded-xl text-sm text-indigo-300 hover:bg-white/10 transition font-medium">
              Sign Out
            </button>
          </form>
        </div>
      </aside>
    </>
  )
}
