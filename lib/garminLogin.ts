import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Returns an authenticated GarminConnect client for the given WatchConnection.
 * Tries cached OAuth tokens first to avoid hitting the SSO login flow.
 * Falls back to full login if the cached tokens are missing or fail.
 * Saves fresh tokens back to the database after a successful login.
 */
export async function getGarminClient(conn: {
  id: string
  accessToken: string       // stores garmin email
  refreshToken: string | null  // stores garmin password
  sessionData: string | null   // cached OAuth tokens JSON
}) {
  const { GarminConnect } = await import('garmin-connect')

  const client = new GarminConnect({
    username: conn.accessToken,
    password: conn.refreshToken!,
  })

  // Try loading cached tokens first — avoids full SSO login
  if (conn.sessionData) {
    try {
      const { oauth1, oauth2 } = JSON.parse(conn.sessionData)
      client.loadToken(oauth1, oauth2)
      // Quick check that the token is still valid
      await client.getUserSettings()
      return client
    } catch {
      // Cached token is expired/invalid — fall through to full login
    }
  }

  // Full SSO login
  try {
    await client.login()
  } catch (e: any) {
    const msg = e?.message || String(e)
    if (msg.toLowerCase().includes('mfa') || msg.toLowerCase().includes('ticket not found')) {
      throw new Error('Garmin 2FA/MFA is enabled — athlete must disable two-factor authentication in their Garmin Connect account settings to allow syncing.')
    }
    if (msg.includes('429') || msg.toLowerCase().includes('too many')) {
      throw new Error('Garmin is rate limiting requests. Please wait a few minutes and try again.')
    }
    throw new Error(`Garmin login failed: ${msg}`)
  }

  // Save fresh tokens to DB for next time
  try {
    const tokens = client.exportToken()
    await prisma.watchConnection.update({
      where: { id: conn.id },
      data: { sessionData: JSON.stringify(tokens) },
    })
  } catch {
    // Non-fatal — continue even if we can't save tokens
  }

  return client
}
