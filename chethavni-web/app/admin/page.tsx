import Link from 'next/link'
import { ArrowLeft, ShieldCheck } from 'lucide-react'
import { requireAdmin } from '@/lib/admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { activatePlan, downgradePlan } from './actions'

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ q?: string; message?: string }> }) {
  await requireAdmin()
  const params = await searchParams
  const query = params.q?.trim().toLowerCase() || ''
  const admin = createAdminClient()
  const { data: usersData } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  const users = usersData?.users.filter((user) => !query || user.email?.toLowerCase().includes(query)) ?? []
  const userIds = users.map((user) => user.id)
  const { data: profiles } = userIds.length ? await admin.from('profiles').select('id, plan_tier, plan_expires_at, created_at').in('id', userIds) : { data: [] }
  const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]))

  return (
    <main className="min-h-screen bg-white px-5 py-8 text-slate-800 sm:px-7 sm:py-10">
      <div className="mx-auto max-w-5xl">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition hover:text-indigo-700"><ArrowLeft className="h-4 w-4" />Dashboard</Link>
        <div className="mt-8 flex items-start gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white"><ShieldCheck className="h-5 w-5" /></div><div><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-indigo-600">Admin</p><h1 className="mt-1 text-2xl font-bold text-indigo-950">Plan management</h1><p className="mt-1 text-sm text-slate-500">Manual activations for verified payments.</p></div></div>
        {params.message && <p className="mt-6 rounded-lg border border-lime-200 bg-lime-50 p-3 text-xs font-medium text-lime-800">{params.message}</p>}
        <form className="mt-8 flex gap-2" method="get"><input name="q" defaultValue={params.q} placeholder="Search by account email" className="h-10 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100" /><button className="h-10 rounded-lg bg-indigo-600 px-4 text-xs font-semibold text-white hover:bg-indigo-700">Search</button></form>
        <div className="mt-5 space-y-3">
          {users.map((user) => {
            const profile = profileById.get(user.id)
            return <section key={user.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><p className="text-sm font-semibold text-indigo-950">{user.email}</p><p className="mt-1 text-xs text-slate-500">Plan: {profile?.plan_tier || 'free'} · Expires: {profile?.plan_expires_at ? new Date(profile.plan_expires_at).toLocaleDateString('en-IN') : 'Never'}</p></div><div className="flex flex-wrap gap-2"><form action={activatePlan}><input type="hidden" name="email" value={user.email || ''} /><input type="hidden" name="plan" value="starter" /><button className="h-8 rounded-lg bg-cyan-100 px-3 text-xs font-semibold text-cyan-800 hover:bg-cyan-200">Activate Starter</button></form><form action={activatePlan}><input type="hidden" name="email" value={user.email || ''} /><input type="hidden" name="plan" value="pro" /><button className="h-8 rounded-lg bg-indigo-600 px-3 text-xs font-semibold text-white hover:bg-indigo-700">Activate Pro</button></form><form action={downgradePlan}><input type="hidden" name="email" value={user.email || ''} /><button className="h-8 rounded-lg border border-rose-200 bg-rose-50 px-3 text-xs font-semibold text-rose-700 hover:bg-rose-100">Downgrade</button></form></div></div></section>
          })}
          {!users.length && <p className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">No users found.</p>}
        </div>
      </div>
    </main>
  )
}