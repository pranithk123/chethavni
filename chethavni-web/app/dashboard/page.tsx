import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { signout } from '../login/actions'
import { Button } from '@/components/ui/button'
import { CreatePipelineDialog } from '@/components/CreatePipelineDialog'
import { EmptyState } from '@/components/ui/empty-state'
import {
  ArrowRight,
  BellRing,
  CheckCircle2,
  CircleDot,
  GitBranch,
  Globe2,
  LogOut,
  MessageSquare,
  Webhook,
} from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  const { data: pipelines } = await supabase
    .from('pipelines')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const workflows = pipelines ?? []
  const activeCount = workflows.filter((pipeline) => pipeline.is_active).length

  return (
    <div className="min-h-screen bg-[#f8fbff] text-slate-800">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-7">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600 ring-1 ring-sky-100">
              <GitBranch className="h-4.5 w-4.5" />
            </div>
            <span className="text-[17px] font-bold tracking-tight text-slate-900">Chethavni</span>
            <span className="hidden rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-600 ring-1 ring-violet-100 sm:inline-flex">
              {profile?.tier || 'Free'}
            </span>
          </Link>

          <div className="flex items-center gap-2.5">
            <span className="hidden text-xs text-slate-500 md:block">{user.email}</span>
            <form action={signout}>
              <Button variant="ghost" size="sm" className="h-8 rounded-lg px-2.5 text-xs text-slate-500 hover:bg-slate-50 hover:text-slate-800">
                <LogOut className="mr-1.5 h-3.5 w-3.5" />
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-9 px-5 py-8 sm:px-7 sm:py-10">
        <section className="overflow-hidden rounded-2xl border border-sky-100 bg-white">
          <div className="relative px-6 py-7 sm:px-8 sm:py-9">
            <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-sky-100/60 blur-3xl" />
            <div className="pointer-events-none absolute right-24 -bottom-28 h-56 w-56 rounded-full bg-violet-100/50 blur-3xl" />

            <div className="relative max-w-2xl">
              <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-700 ring-1 ring-sky-100">
                <CircleDot className="h-3 w-3" />
                Workflow automation
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                Connect your apps. Automate the work.
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                Build workflows that receive events from webhooks and route them to the tools you use.
                Start simple, then add more steps as Chethavni grows.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-2.5">
                <CreatePipelineDialog />
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  {activeCount} active workflow{activeCount === 1 ? '' : 's'}
                </span>
              </div>
            </div>
          </div>

          <div className="grid border-t border-slate-100 sm:grid-cols-3">
            <div className="flex items-center gap-3 px-6 py-4 sm:border-r sm:border-slate-100">
              <Webhook className="h-4 w-4 text-sky-500" />
              <div>
                <p className="text-xs font-semibold text-slate-800">Receive</p>
                <p className="text-[11px] text-slate-500">Webhooks & events</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-6 py-4 sm:border-r sm:border-slate-100">
              <GitBranch className="h-4 w-4 text-violet-500" />
              <div>
                <p className="text-xs font-semibold text-slate-800">Process</p>
                <p className="text-[11px] text-slate-500">Map & transform data</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-6 py-4">
              <Globe2 className="h-4 w-4 text-sky-500" />
              <div>
                <p className="text-xs font-semibold text-slate-800">Deliver</p>
                <p className="text-[11px] text-slate-500">Apps & HTTP endpoints</p>
              </div>
            </div>
          </div>
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
                  className="group rounded-xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-[0_8px_30px_rgba(14,165,233,0.08)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                          <GitBranch className="h-4 w-4" />
                        </div>
                        <h3 className="truncate text-sm font-semibold text-slate-900 group-hover:text-sky-700">
                          {workflow.name}
                        </h3>
                      </div>
                      <p className="mt-3 line-clamp-2 text-xs leading-5 text-slate-500">
                        {workflow.description || 'Automation workflow with a webhook trigger and configurable actions.'}
                      </p>
                    </div>

                    <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ring-1 ${
                      workflow.is_active
                        ? 'bg-emerald-50 text-emerald-700 ring-emerald-100'
                        : 'bg-slate-50 text-slate-500 ring-slate-200'
                    }`}>
                      {workflow.is_active ? 'Active' : 'Paused'}
                    </span>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3">
                    <span className="text-[11px] text-slate-400">Open workflow</span>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600">
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
