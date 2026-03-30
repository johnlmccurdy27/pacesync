import { auth } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import { PrismaClient } from '@prisma/client'
import Link from 'next/link'
import Sidebar from '@/app/components/Sidebar'
import WorkoutLibraryDropdown from '@/app/components/WorkoutLibraryDropdown'

const prisma = new PrismaClient()

export default async function WorkoutsPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const allWorkouts = await prisma.workout.findMany({
    where: { coachId: session.user.id },
    orderBy: { createdAt: 'desc' },
    include: { steps: true, coach: { select: { name: true, email: true } } }
  })

  const recent = allWorkouts.slice(0, 5)

  const libraryWorkouts = allWorkouts.map(w => ({
    id: w.id,
    name: w.name,
    createdAt: w.createdAt.toISOString(),
    stepCount: w.steps.length,
  }))

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar userName={session.user?.name || session.user?.email || undefined} />

      <main className="flex-1 lg:ml-64 min-w-0">
        <div className="px-4 lg:px-8 py-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 hidden lg:block">Workouts</h1>
          <div className="flex items-center gap-3">
            <WorkoutLibraryDropdown workouts={libraryWorkouts} />
            <Link
              href="/workouts/new"
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition"
            >
              <span>+</span>
              New Workout
            </Link>
          </div>
        </div>

        <div className="px-4 lg:px-8 pb-8">
          {allWorkouts.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center border-2 border-dashed border-gray-300">
              <div className="text-6xl mb-4">🏃</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No workouts yet</h3>
              <p className="text-gray-600 mb-6">Create your first workout to get started</p>
              <Link
                href="/workouts/new"
                className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition"
              >
                Create Workout
              </Link>
            </div>
          ) : (
            <>
              <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">5 Most Recent Workouts</p>
              <div className="grid gap-4">
                {recent.map(workout => (
                  <Link
                    key={workout.id}
                    href={`/workouts/${workout.id}`}
                    className="bg-white rounded-xl p-6 border border-gray-200 hover:border-indigo-400 hover:shadow-md transition"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">{workout.name}</h3>
                      <span className="hidden md:block text-sm text-gray-400 flex-shrink-0 ml-4">
                        Created by Coach {workout.coach.name ?? workout.coach.email} on {new Date(workout.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                      {workout.steps.length} steps
                    </span>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
