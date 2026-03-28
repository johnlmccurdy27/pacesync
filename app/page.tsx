import Link from 'next/link'
import Image from 'next/image'
import LogoIcon from '@/app/components/logo.svg'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex flex-col">
        <Image src="/Boston.jpg" alt="Boston Marathon" fill className="object-cover object-center" priority />
        {/* Blue-tinted gradient overlay — darker at bottom for content legibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/65 via-indigo-950/55 to-black/80" />

        {/* Nav — floats over image */}
        <nav className="relative z-10 flex items-center justify-between px-6 lg:px-16 overflow-hidden">
          <div className="relative w-32 h-32 flex items-center justify-center transform scale-150 -mt-6 -mb-6">
            <Image src={LogoIcon} alt="Structur logo" width={300} height={300} className="object-contain" priority />
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className="text-white/75 hover:text-white font-medium px-4 py-2 transition text-sm">
              Log in
            </Link>
            <Link href="/signup" className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition shadow-lg shadow-indigo-900/40">
              Get started
            </Link>
          </div>
        </nav>

        {/* Hero content */}
        <div className="relative z-10 flex-1 flex items-center justify-center px-6 lg:px-16">
          <div className="max-w-3xl w-full mx-auto text-center">
            <h1 className="text-5xl lg:text-7xl font-black text-white leading-[1.05] tracking-tight mb-10">
              Build workouts.
              <br />
              <span className="bg-gradient-to-r from-indigo-300 to-blue-200 bg-clip-text text-transparent">
                Sync to every watch.
              </span>
            </h1>
            <Link href="/signup" className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 py-4 rounded-xl text-base transition shadow-2xl shadow-indigo-900/50">
              Start for free →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="bg-white px-6 lg:px-16 py-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-indigo-600 font-semibold text-sm uppercase tracking-widest mb-3">Features</p>
            <h2 className="text-3xl lg:text-4xl font-black text-gray-900 mb-4">
              Everything you need to coach professionally
            </h2>
            <p className="text-gray-500 max-w-lg mx-auto leading-relaxed">
              From workout design to device sync — all in one clean platform built around how coaches actually work.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="group relative bg-white rounded-2xl p-8 border border-gray-100 hover:border-indigo-200 shadow-sm hover:shadow-lg transition-all duration-300">
              <div className="w-11 h-11 bg-indigo-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2">Structured Workout Builder</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Create sessions with warmups, intervals, repeat blocks, and cooldowns. Set distance or time targets with exact training zones per step.
              </p>
            </div>

            {/* Card 2 — slightly elevated */}
            <div className="group relative bg-indigo-600 rounded-2xl p-8 shadow-xl shadow-indigo-200 hover:shadow-indigo-300 hover:-translate-y-1 transition-all duration-300">
              <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  <circle cx="12" cy="12" r="3" fill="currentColor" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-white mb-2">Direct Watch Sync</h3>
              <p className="text-indigo-200 text-sm leading-relaxed">
                Push workouts straight to Garmin and COROS devices as native structured workouts — athletes see step-by-step guidance on their wrist.
              </p>
            </div>

            {/* Card 3 */}
            <div className="group relative bg-white rounded-2xl p-8 border border-gray-100 hover:border-indigo-200 shadow-sm hover:shadow-lg transition-all duration-300">
              <div className="w-11 h-11 bg-indigo-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2">Athlete Groups & Scheduling</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Organise athletes into training groups and schedule workouts across your whole squad from a single calendar view.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <section className="bg-indigo-50 border-y border-indigo-100 px-6 lg:px-16 py-12">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-3xl font-black text-indigo-600 mb-1">Garmin + COROS</div>
            <div className="text-sm text-gray-500 font-medium">Native device support</div>
          </div>
          <div>
            <div className="text-3xl font-black text-indigo-600 mb-1">Zero</div>
            <div className="text-sm text-gray-500 font-medium">Manual entry on athletes&apos; devices</div>
          </div>
          <div>
            <div className="text-3xl font-black text-indigo-600 mb-1">One place</div>
            <div className="text-sm text-gray-500 font-medium">For every training plan &amp; athlete</div>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="px-6 lg:px-16 py-24 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-indigo-600 font-semibold text-sm uppercase tracking-widest mb-3">How it works</p>
            <h2 className="text-3xl lg:text-4xl font-black text-gray-900">Three steps to smarter coaching</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connector line — desktop only */}
            <div className="hidden md:block absolute top-7 left-[calc(16.67%+1.5rem)] right-[calc(16.67%+1.5rem)] h-px bg-indigo-100" />

            {[
              {
                step: '01',
                title: 'Build your workout',
                desc: 'Use the visual builder to create structured sessions — add steps, set zones, and configure repeat blocks.',
              },
              {
                step: '02',
                title: 'Assign to your athletes',
                desc: 'Schedule the workout for a group or individual athlete on your training calendar.',
              },
              {
                step: '03',
                title: 'Sync to their watch',
                desc: 'Athletes receive the full structured workout on their Garmin or COROS — ready to execute, step by step.',
              },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex flex-col items-start md:items-center md:text-center">
                <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-indigo-200 flex-shrink-0 relative z-10">
                  <span className="text-white font-black text-sm tracking-tight">{step}</span>
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative overflow-hidden px-6 lg:px-16 py-24 bg-indigo-600">
        {/* Subtle background texture */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500 via-indigo-600 to-indigo-800" />
        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <h2 className="text-3xl lg:text-5xl font-black text-white mb-4 leading-tight">
            Ready to coach smarter?
          </h2>
          <p className="text-indigo-200 text-lg mb-10 leading-relaxed">
            Join coaches already using Structur to build and deliver professional training plans — direct to the wrist.
          </p>
          <Link
            href="/signup"
            className="inline-block bg-white text-indigo-700 font-bold px-10 py-4 rounded-xl text-base transition hover:bg-indigo-50 shadow-2xl shadow-indigo-900/40"
          >
            Create your free account →
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="px-6 lg:px-16 py-8 border-t border-gray-100">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm text-gray-400">© {new Date().getFullYear()} Structur</span>
          <div className="flex gap-6 text-sm text-gray-400">
            <Link href="/login" className="hover:text-gray-900 transition">Log in</Link>
            <Link href="/signup" className="hover:text-gray-900 transition">Sign up</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}
