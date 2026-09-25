import { createHash } from 'node:crypto'
import { headers } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'

export function canonicalizeGmailAddress(value: string) {
  const email = value.trim().toLowerCase()
  const match = email.match(/^([^@\s]+)@gmail\.com$/)
  if (!match) return null

  const localPart = match[1].split('+', 1)[0].replace(/\./g, '')
  if (!localPart) return null
  return `${localPart}@gmail.com`
}

export async function enforceSignupRateLimit() {
  const requestHeaders = await headers()
  const forwardedFor = requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim()
  const ipAddress = forwardedFor || requestHeaders.get('x-real-ip') || 'unknown'
  const ipHash = createHash('sha256').update(ipAddress).digest('hex')
  const admin = createAdminClient()
  const { data, error } = await admin.rpc('check_signup_rate_limit', {
    p_ip_hash: ipHash,
    p_limit: 5,
  })

  if (error || data !== true) {
    throw new Error('Too many signup attempts. Please try again later.')
  }
}
