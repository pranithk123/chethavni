'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { normalizePlanTier } from '@/lib/plan-limits'

async function findUserByEmail(email: string) {
  const admin = createAdminClient()
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (error) throw new Error('Unable to search users.')
  const user = data.users.find((candidate) => candidate.email?.toLowerCase() === email.trim().toLowerCase())
  if (!user) throw new Error('No account found for that email.')
  return { admin, user }
}

export async function activatePlan(formData: FormData) {
  const adminUser = await requireAdmin()
  const email = String(formData.get('email') || '')
  const plan = normalizePlanTier(formData.get('plan'))
  if (plan === 'free') throw new Error('Choose Starter or Pro to activate a paid plan.')

  const { admin, user } = await findUserByEmail(email)
  const { data: profile } = await admin.from('profiles').select('plan_expires_at').eq('id', user.id).maybeSingle()
  const currentExpiry = profile?.plan_expires_at && new Date(profile.plan_expires_at) > new Date() ? new Date(profile.plan_expires_at) : new Date()
  const expiresAt = new Date(currentExpiry)
  expiresAt.setMonth(expiresAt.getMonth() + 1)
  const amount = plan === 'pro' ? 299 : 99

  const { error: profileError } = await admin.from('profiles').update({
    plan_tier: plan,
    plan_expires_at: expiresAt.toISOString(),
    plan_updated_at: new Date().toISOString(),
  }).eq('id', user.id)
  if (profileError) {
    console.error('Unable to update the user plan.', {
      code: profileError.code,
      details: profileError.details,
      hint: profileError.hint,
      message: profileError.message,
      userId: user.id,
      plan,
    })
    throw new Error('Unable to update the user plan.')
  }

  const { error: subscriptionError } = await admin.from('manual_subscriptions').insert({
    user_id: user.id,
    plan_tier: plan,
    amount,
    currency: 'INR',
    started_at: new Date().toISOString(),
    expires_at: expiresAt.toISOString(),
    activated_by: adminUser.id,
    payment_method: 'whatsapp_manual',
  })
  if (subscriptionError) throw new Error('Plan updated, but the subscription record could not be created.')

  revalidatePath('/dashboard')
  revalidatePath('/profile')
  redirect('/admin?message=Plan activated successfully.')
}

export async function downgradePlan(formData: FormData) {
  await requireAdmin()
  const email = String(formData.get('email') || '')
  const { admin, user } = await findUserByEmail(email)
  const { error } = await admin.from('profiles').update({
    plan_tier: 'free',
    plan_expires_at: null,
    plan_updated_at: new Date().toISOString(),
  }).eq('id', user.id)
  if (error) throw new Error('Unable to downgrade the user.')
  revalidatePath('/dashboard')
  revalidatePath('/profile')
  redirect('/admin?message=User downgraded to Free.')
}