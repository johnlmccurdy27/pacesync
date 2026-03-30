import { auth } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import { PrismaClient } from '@prisma/client'
import Sidebar from '@/app/components/Sidebar'
import Link from 'next/link'

const prisma = new PrismaClient()

export default async function AthleteGroupsPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { email: session.user!.email! },
    include: {
      athleteGroups: {
        include: {
          group: {
            include: {
              coach: { select: { name: true, profilePicture: true, bio: true, clubName: true } },
              _count: { select: { members: true } }
            }
          }
        }
      }
    }
  })

  if (!user || user.role !== 'athlete') redirect('/dashboard-redirect')

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar userName={user.name || user.email} />

      <main className="flex-1 lg:ml-64 min-w-0">
        <div className="px-4 lg:px-8 py-6">
          <h1 className="text-2xl font-bold text-gray-900 hidden lg:block">My Groups</h1>
        </div>

        <div className="px-4 lg:px-8 pb-8">
          {user.athleteGroups.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center border-2 border-dashed border-gray-300">
              <div className="text-6xl mb-4">👥</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No groups yet</h3>
              <p className="text-gray-500 text-sm">Your coach will add you to a training group</p>
            </div>
          ) : (
            <div className="space-y-4">
              {user.athleteGroups.map(membership => (
                <div key={membership.id} className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{membership.group.name}</h3>
                      {membership.group.description && (
                        <p className="text-sm text-gray-500 mt-0.5">{membership.group.description}</p>
                      )}
                    </div>
                    <span className="text-sm text-gray-400 font-medium flex-shrink-0 ml-4">
                      {membership.group._count.members} {membership.group._count.members === 1 ? 'athlete' : 'athletes'}
                    </span>
                  </div>

                  {membership.group.coach && (
                    <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                      <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {membership.group.coach.profilePicture
                          ? <img src={membership.group.coach.profilePicture} className="w-full h-full object-cover" alt="" />
                          : <span className="text-sm font-bold text-indigo-600">{membership.group.coach.name?.charAt(0) || 'C'}</span>
                        }
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-700">{membership.group.coach.name || 'Your Coach'}</p>
                        {membership.group.coach.clubName && (
                          <p className="text-xs text-gray-400">{membership.group.coach.clubName}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
