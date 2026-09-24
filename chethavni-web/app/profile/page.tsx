import Link from 'next/link'
import { ArrowLeft, CalendarDays, Gauge, Layers3 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getPlanSnapshot, planLabel } from '@/lib/plan-limits'
import { redirect } from 'next/navigation'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const snapshot = await getPlanSnapshot(supabase, user.id)
  const percent = Math.min(100, Math.round((snapshot.executionCount / snapshot.limits.executionLimit) * 100))
  const date = (value: string | null) => value ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(value)) : 'Not available'

  return (
    <main className="min-h-screen bg-white px-5 py-8 text-slate-800 sm:px-7 sm:py-10">
      <div className="mx-auto max-w-4xl">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition hover:text-indigo-700"><ArrowLeft className="h-4 w-4" />Dashboard</Link>
        <div className="mt-8"><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-indigo-600">Account</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-indigo-950">Your profile</h1></div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-indigo-700"><CalendarDays className="h-4 w-4" /><h2 className="text-sm font-semibold">Account</h2></div>
            <p className="mt-5 text-sm font-semibold text-slate-900">{user.email}</p>
            <p className="mt-1 text-xs text-slate-500">Created {date(snapshot.createdAt)}</p>
          </section>
          <section className="rounded-xl border border-indigo-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-indigo-700"><Layers3 className="h-4 w-4" /><h2 className="text-sm font-semibold">Current plan</h2></div>
            <p className="mt-5 text-lg font-bold text-indigo-950">{planLabel(snapshot.plan)}</p>
            <p className="mt-1 text-xs text-slate-500">₹{snapshot.limits.price} / {snapshot.plan === 'free' ? 'always' : 'month'}</p>
            {snapshot.plan !== 'free' && <p className="mt-3 text-xs font-medium text-lime-700">Active until {date(snapshot.expiresAt)}</p>}
            {snapshot.plan === 'free' && <Link href="/pricing" className="mt-4 inline-flex text-xs font-semibold text-indigo-600 hover:text-indigo-800">View paid plans</Link>}
          </section>
        </div>

        <section className="mt-4 rounded-xl border border-cyan-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4"><div className="flex items-center gap-2 text-cyan-700"><Gauge className="h-4 w-4" /><h2 className="text-sm font-semibold">Usage</h2></div><span className="text-xs font-semibold text-slate-500">{percent}%</span></div>
          <p className="mt-5 text-lg font-bold text-indigo-950">{snapshot.executionCount.toLocaleString()} / {snapshot.limits.executionLimit.toLocaleString()} executions {snapshot.limits.executionPeriod === 'day' ? 'today' : 'this month'}</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-cyan-100"><div className="h-full rounded-full bg-cyan-500" style={{ width: `${percent}%` }} /></div>
          <p className="mt-3 text-xs text-slate-500">Daily safety cap: {snapshot.limits.dailySafetyLimit.toLocaleString()} executions.</p>
        </section>

        <section className="mt-4 rounded-xl border border-fuchsia-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-fuchsia-800">Workflow limits</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2"><div><p className="text-lg font-bold text-indigo-950">{snapshot.workflowCount} / {snapshot.limits.workflowLimit}</p><p className="text-xs text-slate-500">Workflows used</p></div><div><p className="text-lg font-bold text-indigo-950">{snapshot.limits.destinationLimit}</p><p className="text-xs text-slate-500">Destinations per workflow</p></div></div>
        </section>
      </div>
    </main>
  )
}