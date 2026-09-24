import type { SupabaseClient } from '@supabase/supabase-js'

export type PlanTier = 'free' | 'starter' | 'pro'

export const PLAN_LIMITS: Record<PlanTier, {
  price: number
  workflowLimit: number
  destinationLimit: number
  executionLimit: number
  executionPeriod: 'day' | 'month'
  dailySafetyLimit: number
}> = {
  free: {
    price: 0,
    workflowLimit: 2,
    destinationLimit: 2,
    executionLimit: 100,
    executionPeriod: 'day',
    dailySafetyLimit: 100,
  },
  starter: {
    price: 99,
    workflowLimit: 10,
    destinationLimit: 5,
    executionLimit: 5000,
    executionPeriod: 'month',
    dailySafetyLimit: 2000,
  },
  pro: {
    price: 299,
    workflowLimit: 50,
    destinationLimit: 10,
    executionLimit: 25000,
    executionPeriod: 'month',
    dailySafetyLimit: 10000,
  },
}

export function normalizePlanTier(value: unknown): PlanTier {
  const tier = String(value || '').toLowerCase()
  return tier === 'starter' || tier === 'pro' ? tier : 'free'
}

export function isPlanActive(planTier: unknown, expiresAt: string | null | undefined) {
  if (planTier !== 'starter' && planTier !== 'pro') return false
  return Boolean(expiresAt && new Date(expiresAt).getTime() > Date.now())
}

export function effectivePlan(planTier: unknown, expiresAt: string | null | undefined): PlanTier {
  const normalized = normalizePlanTier(planTier)
  return normalized !== 'free' && !isPlanActive(normalized, expiresAt) ? 'free' : normalized
}

export async function getPlanSnapshot(supabase: SupabaseClient, userId: string) {
  const [{ data: profile }, { count: workflowCount }] = await Promise.all([
    supabase.from('profiles').select('plan_tier, plan_expires_at, created_at').eq('id', userId).maybeSingle(),
    supabase.from('pipelines').select('id', { count: 'exact', head: true }).eq('user_id', userId),
  ])

  const plan = effectivePlan(profile?.plan_tier, profile?.plan_expires_at)
  const limits = PLAN_LIMITS[plan]
  const periodStart = new Date()
  if (limits.executionPeriod === 'day') {
    periodStart.setHours(0, 0, 0, 0)
  } else {
    periodStart.setDate(1)
    periodStart.setHours(0, 0, 0, 0)
  }

  const { data: usage } = await supabase
    .from('usage_records')
    .select('execution_count')
    .eq('user_id', userId)
    .eq('period_type', limits.executionPeriod)
    .eq('period_start', periodStart.toISOString().slice(0, 10))
    .maybeSingle()

  return {
    plan,
    limits,
    expiresAt: profile?.plan_expires_at ?? null,
    createdAt: profile?.created_at ?? null,
    workflowCount: workflowCount ?? 0,
    executionCount: usage?.execution_count ?? 0,
  }
}

export function planLabel(plan: PlanTier) {
  return plan.charAt(0).toUpperCase() + plan.slice(1)
}

export async function assertCanAddDestination(
  supabase: SupabaseClient,
  pipelineId: string,
  userId: string,
) {
  const [{ data: pipeline }, { data: profile }, { count }] = await Promise.all([
    supabase.from('pipelines').select('id').eq('id', pipelineId).eq('user_id', userId).maybeSingle(),
    supabase.from('profiles').select('plan_tier, plan_expires_at').eq('id', userId).maybeSingle(),
    supabase.from('destinations').select('id', { count: 'exact', head: true }).eq('pipeline_id', pipelineId),
  ])

  if (!pipeline) throw new Error('Workflow not found.')

  const plan = effectivePlan(profile?.plan_tier, profile?.plan_expires_at)
  const limit = PLAN_LIMITS[plan].destinationLimit
  if ((count ?? 0) >= limit) {
    throw new Error(`${planLabel(plan)} plan allows up to ${limit} destinations per workflow.`)
  }
}

export async function assertPipelineOwner(
  supabase: SupabaseClient,
  pipelineId: string,
  userId: string,
) {
  const { data: pipeline } = await supabase
    .from('pipelines')
    .select('id')
    .eq('id', pipelineId)
    .eq('user_id', userId)
    .maybeSingle()

  if (!pipeline) throw new Error('Workflow not found.')
}