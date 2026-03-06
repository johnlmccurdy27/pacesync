import { auth } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import { PrismaClient } from '@prisma/client'
import Link from 'next/link'

const prisma = new PrismaClient()

export default async function WorkoutsPage() {
  const session = await auth()
  
  if (!session) {
    redirect('/login')
  }

  const workouts = await prisma.workout.findMany({
    where: {
      coachId: session.user.id
    },
    orderBy: {
      createdAt: 'desc'
    },
    include: {
      steps: {
        orderBy: {
          position: 'asc'
        }
      }
    }
  })

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
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Workouts</h2>
            <p className="text-gray-600">Create and manage your training sessions</p>
          </div>
          <Link 
            href="/workouts/new"
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition"
          >
            + New Workout
          </Link>
        </div>

        {/* Workouts List */}
        {workouts.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border-2 border-dashed border-gray-300">
            <div className="text-6xl mb-4">🏃</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No workouts yet</h3>
            <p className="text-gray-600 mb-6">Create your first workout to get started</p>
            <Link 
              href="/workouts/new"
              className="inline-block bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition"
            >
              Create Workout
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {workouts.map((workout) => (
              <Link 
                key={workout.id}
                href={`/workouts/${workout.id}`}
                className="bg-white rounded-xl p-6 border border-gray-200 hover:border-purple-500 hover:shadow-md transition"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-semibold text-gray-900">{workout.name}</h3>
                  <span className="text-sm text-gray-500">
                    {new Date(workout.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {workout.notes && (
                  <p className="text-gray-600 mb-3">{workout.notes}</p>
                )}
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                    {workout.steps.length} steps
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}