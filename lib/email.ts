import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = `Structur <${process.env.RESEND_FROM_EMAIL ?? 'noreply@structur.fit'}>`
const BASE_URL = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'

const emailHeader = `
  <div style="background: linear-gradient(180deg, #1a1f6e 0%, #3d52d4 100%); padding: 28px 24px; text-align: center; border-radius: 12px 12px 0 0;">
    <img src="${BASE_URL}/logo.svg" alt="Structur" width="80" height="80"
         style="display: inline-block; margin-bottom: 4px;"
         onerror="this.style.display='none'" />
    <div style="color: #fbbf24; font-size: 22px; font-weight: 800; letter-spacing: 0.08em; font-family: sans-serif;">
      STRUCTUR
    </div>
    <div style="color: rgba(255,255,255,0.6); font-size: 11px; letter-spacing: 0.12em; font-family: sans-serif; margin-top: 2px;">
      LET'S GET YOUR ATHLETES MOVING
    </div>
  </div>
`

const emailFooter = `
  <div style="padding: 24px; text-align: center; border-top: 1px solid #e5e7eb; margin-top: 32px;">
    <p style="color: #9ca3af; font-size: 12px; margin: 0; font-family: sans-serif;">
      Structur · Built for coaches who move fast
    </p>
  </div>
`

export async function sendWelcomeEmail(to: string, name: string | null): Promise<void> {
  await resend.emails.send({
    from: FROM,
    to,
    subject: 'Welcome to Structur',
    html: `
      <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb;">
        ${emailHeader}
        <div style="padding: 32px 24px; font-family: sans-serif; color: #111827;">
          <h1 style="color: #1a1f6e; font-size: 22px; margin: 0 0 12px;">
            Welcome${name ? `, ${name}` : ''}!
          </h1>
          <p style="color: #4b5563; line-height: 1.6; margin: 0 0 16px;">
            Your Structur account is ready. Create structured workouts, build athlete groups,
            and sync sessions directly to Garmin and COROS devices.
          </p>
          <a href="${BASE_URL}/dashboard"
             style="display: inline-block; padding: 12px 28px; background: #3d52d4; color: #ffffff;
                    text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 15px;">
            Go to Dashboard
          </a>
        </div>
        ${emailFooter}
      </div>
    `,
  })
}

export async function sendAthleteInviteEmail(
  to: string,
  coachName: string,
  token: string
): Promise<void> {
  const inviteUrl = `${BASE_URL}/signup?invite=${token}`
  await resend.emails.send({
    from: FROM,
    to,
    subject: `${coachName} invited you to Structur`,
    html: `
      <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb;">
        ${emailHeader}
        <div style="padding: 32px 24px; font-family: sans-serif; color: #111827;">
          <h1 style="color: #1a1f6e; font-size: 22px; margin: 0 0 12px;">
            You've been invited!
          </h1>
          <p style="color: #4b5563; line-height: 1.6; margin: 0 0 8px;">
            <strong>${coachName}</strong> has invited you to join their team on Structur.
          </p>
          <p style="color: #4b5563; line-height: 1.6; margin: 0 0 24px;">
            You'll receive structured workouts that sync directly to your Garmin or COROS device.
          </p>
          <a href="${inviteUrl}"
             style="display: inline-block; padding: 12px 28px; background: #3d52d4; color: #ffffff;
                    text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 15px;">
            Accept Invitation
          </a>
          <p style="color: #6b7280; font-size: 13px; margin-top: 24px;">
            This link expires in 7 days. If you weren't expecting this, you can safely ignore it.
          </p>
        </div>
        ${emailFooter}
      </div>
    `,
  })
}
