import { auth } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const session = await auth()
  
  if (!session) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
              P
            </div>
            <h1 className="text-2xl font-bold text-gray-900">PaceSync</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {session.user?.name || session.user?.email}
            </span>
            <form action="/api/auth/signout" method="POST">
              <button className="text-sm text-gray-600 hover:text-gray-900">
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {session.user?.name?.split(' ')[0]}! 👋
          </h2>
          <p className="text-gray-600">
            Your PaceSync dashboard is ready. Let's get your athletes moving.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="text-sm font-medium text-gray-600 mb-1">Total Athletes</div>
            <div className="text-3xl font-bold text-gray-900">0</div>
            <div className="text-sm text-gray-500 mt-2">No athletes yet</div>
          </div>
          
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="text-sm font-medium text-gray-600 mb-1">Workouts Created</div>
            <div className="text-3xl font-bold text-gray-900">0</div>
            <div className="text-sm text-gray-500 mt-2">Ready to create your first?</div>
          </div>
          
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="text-sm font-medium text-gray-600 mb-1">This Week</div>
            <div className="text-3xl font-bold text-gray-900">0</div>
            <div className="text-sm text-gray-500 mt-2">Workouts synced</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 text-xl">+</span>
              </div>
              <div className="text-left">
                <div className="font-semibold text-gray-900">Create Workout</div>
                <div className="text-sm text-gray-500">Build a new training session</div>
              </div>
            </button>
            
            <button className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 text-xl">👥</span>
              </div>
              <div className="text-left">
                <div className="font-semibold text-gray-900">Invite Athletes</div>
                <div className="text-sm text-gray-500">Add athletes to your club</div>
              </div>
            </button>
          </div>
        </div>

        {/* Coming Soon Banner */}
        <div className="mt-8 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-200">
          <div className="flex items-start gap-4">
            <div className="text-3xl">🚀</div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">
                Your MVP is Live!
              </h4>
              <p className="text-gray-600 text-sm mb-3">
                You've successfully set up your PaceSync account. Next steps: wait for Garmin API approval, 
                then we'll add the workout builder and watch sync functionality.
              </p>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                  ✓ Authentication Working
                </span>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                  ✓ Database Connected
                </span>
                <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                  ⏳ Awaiting Garmin Approval
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}