import { auth } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import { PrismaClient } from '@prisma/client'
import Sidebar from '@/app/components/Sidebar'
import FitnessChart from '@/app/components/FitnessChart'
import Image from 'next/image'
import Link from 'next/link'

const prisma = new PrismaClient()

export default async function AthleteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.email) redirect('/login')

  const coach = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!coach || coach.role !== 'coach') redirect('/dashboard')

  const athlete = await prisma.user.findUnique({
    where: { id },
    include: {
      watchConnections: true,
      athleteGroups: { include: { group: true } }
    }
  })
  if (!athlete) redirect('/athletes')

  const coachGroups = athlete.athleteGroups.filter(m => m.group.coachId === coach.id)

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar userName={coach.name || coach.email} />

      <main className="flex-1 lg:ml-64 w-full">
        <div className="px-4 lg:px-8 py-6">
          <Link href="/athletes" className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">← Back to Athletes</Link>
        </div>

        <div className="p-4 lg:p-8 max-w-2xl space-y-6">
          {/* Header */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 flex items-center gap-6">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-indigo-100 flex-shrink-0 flex items-center justify-center">
              {athlete.profilePicture ? (
                <img src={athlete.profilePicture} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-bold text-indigo-600">
                  {(athlete.name || athlete.email).charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{athlete.name || 'Unnamed Athlete'}</h1>
              <p className="text-gray-500 text-sm">{athlete.email}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {coachGroups.map(m => (
                  <span key={m.id} className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">{m.group.name}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Training Load */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Training Load</h3>
            <div className="flex items-center gap-6">
              <div className="flex-shrink-0 w-24 h-24 relative">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#f3f4f6" strokeWidth="10" />
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#3730a3" strokeWidth="10"
                    strokeDasharray={`${2 * Math.PI * 40 * 0.68} ${2 * Math.PI * 40}`}
                    strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-gray-900">68</span>
                  <span className="text-xs text-gray-400">/100</span>
                </div>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Moderate Load</p>
                <p className="text-sm text-gray-500 mt-1">Weekly training stress is within a healthy range.</p>
                <p className="text-xs text-gray-400 mt-3">* Will calculate from watch data once connected</p>
              </div>
            </div>
          </div>

          {/* Fitness Chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Fitness Score</h3>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">Last 12 weeks</span>
            </div>
            <FitnessChart />
            <p className="text-xs text-gray-400 mt-3 text-center">* Fitness data will update automatically once watch is connected</p>
          </div>

          {/* Connected Device */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Connected Device</h3>
            {athlete.watchConnections.length === 0 ? (
              <div className="flex items-center gap-4">
                <p className="text-gray-500 text-sm">No device connected yet.</p>
                <div className="flex items-center gap-4 opacity-30">
                  <div className="w-16 h-9 relative"><Image src="/Garmin logo.svg" alt="Garmin" fill className="object-contain" /></div>
                  <div className="w-16 h-9 relative"><Image src="/Coros logo.png" alt="COROS" fill className="object-contain" /></div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-6">
                {athlete.watchConnections.map(conn => (
                  <div key={conn.platform} className="flex items-center gap-3">
                    <div className="relative w-20 h-10">
                      {conn.platform === 'garmin'
                        ? <Image src="/Garmin logo.svg" alt="Garmin" fill className="object-contain" />
                        : <Image src="/Coros logo.png" alt="COROS" fill className="object-contain" />
                      }
                    </div>
                    <span className="text-sm text-green-600 font-semibold">Connected</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
