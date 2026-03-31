'use client'

import { useState, useRef } from 'react'

const TAGLINES = [
  'Bring Structur to your training.',
  'Your coach. Your plan. Your watch.',
  'Structured training, delivered.',
  'Every session, perfectly planned.',
  'Train smart. Race faster.',
  'From coach to watch in seconds.',
  'Human coaching with Intelligent Analysis.',
]
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import LogoIcon from '@/app/components/logo.svg'

export default function LoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [error, setError] = useState('')
  const tagline = useRef(TAGLINES[Math.floor(Math.random() * TAGLINES.length)]).current

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      // Fetch CSRF token first to avoid MissingCSRF error in NextAuth v5 beta
      const csrfRes = await fetch('/api/auth/csrf')
      const { csrfToken } = await csrfRes.json()

      const result = await signIn('credentials', {
        redirect: false,
        csrfToken,
        email: formData.email,
        password: formData.password
      })

      if (result?.error) {
        setError('Invalid email or password')
        return
      }

      router.push('/dashboard-redirect')
    } catch (err) {
      setError('Something went wrong')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative" style={{ backgroundImage: 'url(/Boston2.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div className="absolute inset-0 bg-black/55" />
      <div className="relative z-10 rounded-2xl p-8 w-full max-w-md" style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)' }}>
        <div className="flex justify-center mb-2">
          <div className="w-24 h-24 flex items-center justify-center overflow-hidden">
            <Image src={LogoIcon} alt="Structur" width={160} height={160} className="object-contain scale-150" />
          </div>
        </div>
        <p className="text-indigo-200 mb-6 text-center">{tagline}</p>

        {error && (
          <div className="bg-red-500/20 text-red-200 border border-red-400/30 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-indigo-200 mb-1">Email</label>
            <input
              type="email"
              required
              className="w-full px-4 py-2 bg-white border-0 rounded-lg focus:ring-2 focus:ring-yellow-400 text-gray-900"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-indigo-200 mb-1">Password</label>
            <input
              type="password"
              required
              className="w-full px-4 py-2 bg-white border-0 rounded-lg focus:ring-2 focus:ring-yellow-400 text-gray-900"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-yellow-400 hover:bg-yellow-300 text-indigo-900 font-bold py-3 rounded-lg transition mt-2"
          >
            Log In
          </button>
        </form>

        <p className="text-center text-sm text-indigo-200 mt-6">
          Don't have an account?{' '}
          <a href="/signup" className="text-white hover:underline font-medium">
            Sign up
          </a>
        </p>
      </div>
    </div>
  )
}
