import NextAuth, { DefaultSession } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

declare module 'next-auth' {
  interface Session {
    user: { role: string; isAdmin: boolean; isCoach: boolean; isAthlete: boolean } & DefaultSession['user']
  }
}

const prisma = new PrismaClient()

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string }
        })

        if (!user) return null

        const passwordMatch = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        if (!passwordMatch) return null

        return { id: user.id, email: user.email, name: user.name, role: user.role, isAdmin: user.isAdmin, isCoach: user.isCoach, isAthlete: user.isAthlete }
      }
    })
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
        token.isAdmin = (user as any).isAdmin
        token.isCoach = (user as any).isCoach
        token.isAthlete = (user as any).isAthlete
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string
        session.user.isAdmin = token.isAdmin as boolean
        session.user.isCoach = token.isCoach as boolean
        session.user.isAthlete = token.isAthlete as boolean
      }
      return session
    }
  },
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  trustHost: true
})

export const GET = handlers.GET
export const POST = handlers.POST