import { auth } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import { PrismaClient } from '@prisma/client'
import Link from 'next/link'

const prisma = new PrismaClient()

export default async function WorkoutDetailPage({ params }: { params: Promise<{ id: string }> }) {
const { id } = await params;
const session = await auth();  
  if (!session) {
    redirect('/login')
  }

  const workout = await prisma.workout.findUnique({
    where: {
      id: id
    },
    include: {
      steps: {
        orderBy: {
          position: 'asc'
        }
      }
    }
  })

  if (!workout) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Workout not found</h1>
          <Link href="/workouts" className="text-purple-600 hover:underline">
            Back to workouts
          </Link>
        </div>
      </div>
    )
  }

  const totalDistance = workout.steps
    .filter(s => s.measure === 'distance')
    .reduce((sum, s) => sum + s.value, 0)

  const totalTime = workout.steps
    .filter(s => s.measure === 'time')
    .reduce((sum, s) => sum + s.value, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                P
              </div>
              <h1 className="text-2xl font-bold text-gray-900">PaceSync</h1>
            </Link>
            <nav className="flex gap-4">
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">Dashboard</Link>
              <Link href="/workouts" className="text-purple-600 font-semibold">Workouts</Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{session.user?.name}</span>
            <form action="/api/auth/signout" method="POST">
              <button className="text-sm text-gray-600 hover:text-gray-900">Sign Out</button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Back Button */}
        <Link 
          href="/workouts"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          ← Back to workouts
        </Link>

        {/* Workout Header */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">{workout.name}</h2>
              {workout.notes && (
                <p className="text-gray-600">{workout.notes}</p>
              )}
            </div>
            <span className="text-sm text-gray-500">
              Created {new Date(workout.createdAt).toLocaleDateString()}
            </span>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
            <div>
              <div className="text-sm text-gray-600 mb-1">Total Steps</div>
              <div className="text-2xl font-bold text-purple-600">{workout.steps.length}</div>
            </div>
            {totalDistance > 0 && (
              <div>
                <div className="text-sm text-gray-600 mb-1">Total Distance</div>
                <div className="text-2xl font-bold text-purple-600">{totalDistance.toFixed(1)} km</div>
              </div>
            )}
            {totalTime > 0 && (
              <div>
                <div className="text-sm text-gray-600 mb-1">Total Time</div>
                <div className="text-2xl font-bold text-purple-600">{totalTime.toFixed(0)} min</div>
              </div>
            )}
          </div>
        </div>

        {/* Workout Steps */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Workout Steps</h3>
          
          <div className="space-y-3">
            {workout.steps.map((step, index) => (
              <div key={step.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                {/* Step Number */}
                <div className="flex-shrink-0 w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-semibold">
                  {index + 1}
                </div>

                {/* Step Details */}
                <div className="flex-1 grid grid-cols-4 gap-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Type</div>
                    <div className="font-medium text-gray-900 capitalize">{step.type}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Duration</div>
                    <div className="font-medium text-gray-900">
                      {step.value} {step.unit}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Measure</div>
                    <div className="font-medium text-gray-900 capitalize">{step.measure}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Intensity</div>
                    <div className="font-medium text-gray-900">{step.zone || 'N/A'}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-4">
          <button className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition">
            Send to Athletes
          </button>
          <button className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition">
            Edit
          </button>
          <button className="px-6 py-3 border border-red-300 text-red-700 rounded-lg font-semibold hover:bg-red-50 transition">
            Delete
          </button>
        </div>
      </main>
    </div>
  )
}