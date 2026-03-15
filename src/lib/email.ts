import type { Env } from '../env'

async function resendPost(env: Env, payload: object): Promise<void> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Resend error ${res.status}: ${text}`)
  }
}

export async function sendOtpEmail(env: Env, email: string, otp: string): Promise<void> {
  await resendPost(env, {
    from: 'HIREX <noreply@hirex.app>',
    to: email,
    subject: `Your HIREX login code: ${otp}`,
    html: `
      <p>Your one-time login code is:</p>
      <h2 style="letter-spacing: 0.25em;">${otp}</h2>
      <p>This code expires in 10 minutes.</p>
      <p>If you did not request this code, you can safely ignore this email.</p>
    `,
  })
}

export async function sendWelcomeEmail(env: Env, email: string): Promise<void> {
  await resendPost(env, {
    from: 'HIREX <noreply@hirex.app>',
    to: email,
    subject: 'Welcome to HIREX — Funding to Opportunity Tracker',
    html: `
      <h1>Welcome to HIREX!</h1>
      <p>You're now subscribed to the weekly startup funding digest.</p>
      <p>Every two weeks you'll receive a curated list of the top 10 recently funded startups,
         along with hiring signals and outreach contacts.</p>
      <p>You can access the full archive at any time by logging in with your email.</p>
      <p>To unsubscribe, visit your account settings or reply to any digest email.</p>
    `,
  })
}

export async function sendDigestEmail(
  env: Env,
  emails: string[],
  digestHtml: string,
  subject: string,
): Promise<void> {
  // Send in batches of 50 to stay within Resend rate limits
  const BATCH_SIZE = 50
  for (let i = 0; i < emails.length; i += BATCH_SIZE) {
    const batch = emails.slice(i, i + BATCH_SIZE)
    await resendPost(env, {
      from: 'HIREX <digest@hirex.app>',
      to: batch,
      subject,
      html: digestHtml,
    })
  }
}
