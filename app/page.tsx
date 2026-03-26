import Link from 'next/link'
import Image from 'next/image'
import LogoIcon from '@/app/components/logo.svg'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero — full bleed, nav floats on top */}
      <section className="relative min-h-screen flex flex-col">
        {/* Background image */}
        <Image src="/Boston.jpg" alt="Boston Marathon" fill className="object-cover object-center" priority />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/55" />

        {/* Nav */}
        <nav className="relative z-10 flex items-center justify-between px-6 lg:px-12 overflow-hidden">
          <div className="relative w-32 h-32 flex items-center justify-center transform scale-150 -mt-6 -mb-6">
            <Image src={LogoIcon} alt="Structur logo" width={300} height={300} className="object-contain" priority />
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-white/80 hover:text-white font-medium px-4 py-2 transition">Log in</Link>
            <Link href="/signup" className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 py-2 rounded-lg transition">Get started</Link>
          </div>
        </nav>

        {/* Hero content */}
        <div className="relative z-10 flex-1 flex items-center justify-center text-center px-6 lg:px-12 py-24">
          <div className="max-w-4xl mx-auto">
            <div className="inline-block bg-white/20 backdrop-blur-sm text-white text-sm font-semibold px-4 py-1.5 rounded-full mb-6 border border-white/30">
              Built for endurance coaches
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight mb-6 drop-shadow-lg">
              Build workouts.<br />
              <span className="text-orange-400">Sync to every watch.</span>
            </h1>
            <p className="text-xl text-white/85 max-w-2xl mx-auto mb-10 leading-relaxed drop-shadow">
              Structur lets you design structured training sessions and push them directly to your athletes' Garmin and COROS devices — no manual entry, no lost plans.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup" className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-4 rounded-xl text-lg transition shadow-lg">
                Start for free
              </Link>
              <Link href="/login" className="bg-white/15 backdrop-blur-sm border-2 border-white/40 hover:bg-white/25 text-white font-semibold px-8 py-4 rounded-xl text-lg transition">
                Log in
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 px-6 lg:px-12 py-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">
            Everything your coaching needs
          </h2>
          <p className="text-gray-600 text-center mb-14 max-w-xl mx-auto">
            From workout design to athlete management — all in one place.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-5">
                <span className="text-2xl">🏗️</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Structured Workout Builder</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Create sessions with warmups, intervals, repeat blocks, and cooldowns. Set distance or time targets with exact training zones for each step.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-5">
                <span className="text-2xl">⌚</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Direct Watch Sync</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Push workouts straight to Garmin and COROS devices as native structured workouts — athletes see step-by-step guidance on their wrist.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-5">
                <span className="text-2xl">👥</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Athlete Groups</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Organise athletes into training groups and schedule workouts across your whole squad from a single calendar view.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 lg:px-12 py-20 max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-14">How it works</h2>
        <div className="space-y-10">
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
              desc: 'Athletes receive the full structured workout on their Garmin or COROS — ready to execute on race day.',
            },
          ].map(({ step, title, desc }) => (
            <div key={step} className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-sm">{step}</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">{title}</h3>
                <p className="text-gray-600 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-indigo-600 to-indigo-800 px-6 lg:px-12 py-20 text-center">
        <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
          Ready to coach smarter?
        </h2>
        <p className="text-indigo-200 text-lg mb-10 max-w-xl mx-auto">
          Join coaches already using Structur to build and deliver professional training plans.
        </p>
        <Link
          href="/signup"
          className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-semibold px-10 py-4 rounded-xl text-lg transition shadow-lg"
        >
          Create your free account
        </Link>
      </section>

      {/* Footer */}
      <footer className="px-6 lg:px-12 py-8 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-gray-500">© {new Date().getFullYear()} Structur. All rights reserved.</p>
        <div className="flex gap-6 text-sm text-gray-500">
          <Link href="/login" className="hover:text-gray-900 transition">Log in</Link>
          <Link href="/signup" className="hover:text-gray-900 transition">Sign up</Link>
        </div>
      </footer>
    </div>
  )
}
