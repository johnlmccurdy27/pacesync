'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import LogoIcon from '@/app/components/logo.svg'

export default function Header({ userName }: { userName?: string }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()

  const isActive = (path: string) => {
    return pathname.startsWith(path)
  }

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-3 flex-shrink-0">
            <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center shadow-lg"
              style={{ background: 'linear-gradient(180deg, #1a1f6e 0%, #3730a3 100%)' }}>
              <Image src={LogoIcon} alt="Structur logo" width={36} height={36} className="object-contain scale-150" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-700 bg-clip-text text-transparent">
              Structur
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <Link 
              href="/dashboard" 
              className={`px-4 py-2 rounded-lg font-medium transition ${
                isActive('/dashboard') 
                  ? 'bg-indigo-100 text-indigo-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Dashboard
            </Link>
            <Link 
              href="/workouts" 
              className={`px-4 py-2 rounded-lg font-medium transition ${
                isActive('/workouts') 
                  ? 'bg-indigo-100 text-indigo-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Workouts
            </Link>
            <Link 
              href="/athletes" 
              className={`px-4 py-2 rounded-lg font-medium transition ${
                isActive('/athletes') 
                  ? 'bg-indigo-100 text-indigo-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Athletes
            </Link>
          </nav>

          {/* Desktop User Menu */}
          <div className="hidden md:flex items-center gap-4">
            {userName && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-indigo-700">
                    {userName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-sm text-gray-700">{userName}</span>
              </div>
            )}
            <button onClick={() => signOut({ callbackUrl: '/login' })} className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100 transition">
              Sign Out
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <nav className="flex flex-col gap-2">
              <Link 
                href="/dashboard"
                onClick={() => setIsMenuOpen(false)}
                className={`px-4 py-3 rounded-lg font-medium transition ${
                  isActive('/dashboard') 
                    ? 'bg-indigo-100 text-indigo-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Dashboard
              </Link>
              <Link 
                href="/workouts"
                onClick={() => setIsMenuOpen(false)}
                className={`px-4 py-3 rounded-lg font-medium transition ${
                  isActive('/workouts') 
                    ? 'bg-indigo-100 text-indigo-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Workouts
              </Link>
              <Link 
                href="/athletes"
                onClick={() => setIsMenuOpen(false)}
                className={`px-4 py-3 rounded-lg font-medium transition ${
                  isActive('/athletes') 
                    ? 'bg-indigo-100 text-indigo-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Athletes
              </Link>
            </nav>
            
            {/* Mobile User Section */}
            <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
              {userName && (
                <div className="flex items-center gap-3 px-4">
                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-indigo-700">
                      {userName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-700">{userName}</span>
                </div>
              )}
              <div className="px-4">
                <button onClick={() => signOut({ callbackUrl: '/login' })} className="w-full text-left px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100 transition font-medium">
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}