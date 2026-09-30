import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { signout } from '../login/actions'
import { Button } from '@/components/ui/button'
import { CreatePipelineDialog } from '@/components/CreatePipelineDialog'
import { EmptyState } from '@/components/ui/empty-state'
import { getPlanSnapshot, planLabel } from '@/lib/plan-limits'
import {
  ArrowRight,
  BellRing,
  CheckCircle2,
  CircleDot,
  GitBranch,
  LogOut,
  MessageSquare,
} from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [{ data: pipelines }, planSnapshot] = await Promise.all([
    supabase
      .from('pipelines')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    getPlanSnapshot(supabase, user.id),
  ])

  const workflows = pipelines ?? []
  const activeCount = workflows.filter((pipeline) => pipeline.is_active).length
  const usagePercent = Math.min(
    100,
    Math.round((planSnapshot.executionCount / planSnapshot.limits.executionLimit) * 100)
  )

  return (
    <div className="min-h-screen text-slate-800">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-7">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-[0_6px_16px_rgba(79,70,229,0.25)]">
              <GitBranch className="h-4.5 w-4.5" />
            </div>
            <span className="text-[17px] font-bold tracking-tight text-indigo-950">Chethavni</span>
            <span className="hidden rounded-full bg-lime-100 px-2 py-0.5 text-[10px] font-semibold text-lime-800 ring-1 ring-lime-200 sm:inline-flex">
              {planLabel(planSnapshot.plan)}
            </span>
          </Link>

          <nav className="hidden items-center gap-4 text-xs font-semibold text-slate-500 md:flex">
            <Link href="/dashboard" className="text-indigo-700">Workflows</Link>
            <Link href="/pricing" className="transition hover:text-indigo-700">Pricing</Link>
            <Link href="/profile" className="transition hover:text-indigo-700">Profile</Link>
          </nav>

          <div className="flex items-center gap-2.5">
            <span className="hidden text-xs text-slate-500 md:block">{user.email}</span>
            <form action={signout}>
              <Button variant="ghost" size="sm" className="h-8 rounded-lg px-2.5 text-xs text-slate-500 hover:bg-amber-100 hover:text-indigo-950">
                <LogOut className="mr-1.5 h-3.5 w-3.5" />
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-9 px-5 py-8 sm:px-7 sm:py-10">
        <section className="overflow-hidden rounded-2xl border border-cyan-200 bg-white shadow-[0_12px_35px_rgba(30,41,59,0.08)]">
          <div className="relative px-6 py-7 sm:px-8 sm:py-9">
            <div className="relative max-w-2xl">
              <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-indigo-100 px-2.5 py-1 text-[11px] font-semibold text-indigo-800 ring-1 ring-indigo-200">
                <CircleDot className="h-3 w-3" />
                Workflow automation
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-indigo-950 sm:text-3xl">
                Connect your apps. Automate the work.
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                Build workflows that receive events from webhooks and route them to the tools you use.
                Start simple, then add more steps as Chethavni grows.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-2.5">
                <CreatePipelineDialog />
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-medium text-slate-600 ring-1 ring-cyan-200">
                  <CheckCircle2 className="h-3.5 w-3.5 text-lime-600" />
                  {activeCount} active workflow{activeCount === 1 ? '' : 's'}
                </span>
              </div>
            </div>
          </div>

          <div className="grid border-t border-cyan-200/70 sm:grid-cols-3">
            <div className="flex items-center gap-3 px-6 py-4 sm:border-r sm:border-cyan-200/70">
              <Image src="/icons/receive.svg" alt="" width={28} height={28} className="h-7 w-7 object-contain" />
              <div>
                <p className="text-xs font-semibold text-slate-800">Receive</p>
                <p className="text-[11px] text-slate-500">Webhooks & events</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-6 py-4 sm:border-r sm:border-cyan-200/70">
              <Image src="/icons/process.svg" alt="" width={28} height={28} className="h-7 w-7 object-contain" />
              <div>
                <p className="text-xs font-semibold text-slate-800">Process</p>
                <p className="text-[11px] text-slate-500">Map & transform data</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-6 py-4">
              <Image src="/icons/deliver.svg" alt="" width={20} height={20} className="h-5 w-5 object-contain" />
              <div>
                <p className="text-xs font-semibold text-slate-800">Deliver</p>
                <p className="text-[11px] text-slate-500">Apps & HTTP endpoints</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-3">
          <Link href="/profile" className="rounded-xl border border-indigo-200 bg-white p-4 transition hover:border-indigo-300 hover:shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-indigo-600">Plan</p>
            <p className="mt-2 text-lg font-bold text-indigo-950">{planLabel(planSnapshot.plan)}</p>
            <p className="mt-1 text-xs text-slate-500">
              {planSnapshot.plan === 'free' ? '100 executions per day' : `₹${planSnapshot.limits.price} / month`}
            </p>
          </Link>
          <Link href="/profile" className="rounded-xl border border-cyan-200 bg-white p-4 transition hover:border-cyan-300 hover:shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-700">Usage</p>
              <span className="text-[11px] font-semibold text-slate-500">{usagePercent}%</span>
            </div>
            <p className="mt-2 text-lg font-bold text-indigo-950">
              {planSnapshot.executionCount.toLocaleString()} / {planSnapshot.limits.executionLimit.toLocaleString()}
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-cyan-100">
              <div className="h-full rounded-full bg-cyan-500" style={{ width: `${usagePercent}%` }} />
            </div>
          </Link>
          <Link href="/profile" className="rounded-xl border border-fuchsia-200 bg-white p-4 transition hover:border-fuchsia-300 hover:shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-fuchsia-700">Workflows</p>
            <p className="mt-2 text-lg font-bold text-indigo-950">
              {workflows.length} / {planSnapshot.limits.workflowLimit}
            </p>
            <p className="mt-1 text-xs text-slate-500">Configured automations</p>
          </Link>
        </section>

        <section>
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-slate-950">Your workflows</h2>
              <p className="mt-0.5 text-xs text-slate-500">Create, configure and manage your automations.</p>
            </div>
            <div className="hidden items-center gap-1.5 text-[11px] text-slate-400 sm:flex">
              <MessageSquare className="h-3.5 w-3.5" />
              Integrations are added inside each workflow
            </div>
          </div>

          {workflows.length ? (
            <div className="grid gap-3 md:grid-cols-2">
              {workflows.map((workflow) => (
                <Link
                  key={workflow.id}
                  href={`/pipelines/${workflow.id}`}
                  className="group rounded-xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-cyan-300 hover:shadow-[0_12px_30px_rgba(8,145,178,0.12)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center">
                          <Image
                            src="/icons/workflow.svg"
                            alt=""
                            width={24}
                            height={24}
                            className="h-6 w-6 object-contain"
                          />
                        </div>
                        <h3 className="truncate text-sm font-semibold text-indigo-950 group-hover:text-indigo-600">
                          {workflow.name}
                        </h3>
                      </div>
                      <p className="mt-3 line-clamp-2 text-xs leading-5 text-slate-500">
                        {workflow.description || 'Automation workflow with a webhook trigger and configurable actions.'}
                      </p>
                    </div>

                    <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ring-1 ${
                      workflow.is_active
                        ? 'bg-lime-100 text-lime-800 ring-lime-200'
                        : 'bg-amber-100 text-amber-800 ring-amber-200'
                    }`}>
                      {workflow.is_active ? 'Active' : 'Paused'}
                    </span>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-amber-100 pt-3">
                    <span className="text-[11px] text-slate-400">Open workflow</span>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600">
                      Configure
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={BellRing}
              title="No workflows yet"
              description="Create a workflow, choose how it receives data, and connect it to one or more apps."
              action={<CreatePipelineDialog />}
            />
          )}
        </section>
      </main>
    </div>
  )
}
