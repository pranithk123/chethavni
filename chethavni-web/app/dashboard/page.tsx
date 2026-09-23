import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { signout } from '../login/actions'
import { Button } from '@/components/ui/button'
import { CreatePipelineDialog } from '@/components/CreatePipelineDialog'
import { 
  Radio, 
  Activity, 
  Layers, 
  LogOut, 
  ArrowUpRight, 
  SlidersHorizontal 
} from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

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

  const safePipelines = pipelines ?? []
  const activeCount = safePipelines.filter((p) => p.is_active).length

  return (
    <div className="min-h-screen bg-[#0c0d0e] text-zinc-200 antialiased font-sans selection:bg-zinc-700 selection:text-white">
      {/* Top Navbar */}
      <header className="border-b border-zinc-800/80 bg-[#111215]/60 backdrop-blur-md sticky top-0 z-40">
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-zinc-800 border border-zinc-700/80 flex items-center justify-center shadow-inner">
              <Radio className="h-4 w-4 text-emerald-400 animate-pulse" />
            </div>
            <div>
              <span className="font-semibold text-white tracking-tight">Chethavni</span>
              <span className="ml-2 text-[11px] font-mono uppercase px-1.5 py-0.5 rounded bg-zinc-800/80 text-zinc-400 border border-zinc-700/50">
                {profile?.tier || 'Free'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs text-zinc-400 hidden sm:inline-block font-mono">
              {user.email}
            </span>
            <form action={signout}>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors h-8 text-xs font-medium"
              >
                <LogOut className="h-3.5 w-3.5 mr-1.5" />
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-6xl px-6 py-10 space-y-10">
        {/* Overview Stats Bar */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-zinc-800/70 bg-gradient-to-b from-[#15171a] to-[#101114] p-5 shadow-sm">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Total Pipelines</span>
              <Layers className="h-4 w-4 text-zinc-500" />
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">{safePipelines.length}</div>
          </div>

          <div className="rounded-xl border border-zinc-800/70 bg-gradient-to-b from-[#15171a] to-[#101114] p-5 shadow-sm">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Active Ingestion</span>
              <Activity className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">{activeCount}</div>
          </div>

          <div className="rounded-xl border border-zinc-800/70 bg-gradient-to-b from-[#15171a] to-[#101114] p-5 shadow-sm">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Engine Status</span>
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                Operational
              </span>
            </div>
            <div className="text-sm text-zinc-300 font-mono pt-1">Railway Golang Engine</div>
          </div>
        </section>

        {/* Pipeline Controls & Header */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <h2 className="text-lg font-semibold text-white tracking-tight">Active Ingestion Endpoints</h2>
            <p className="text-xs text-zinc-400 mt-0.5">Route TradingView, Chartink, Stripe or custom webhooks into downstream alerts</p>
          </div>
          <CreatePipelineDialog />
        </div>

        {/* Pipelines Cards Grid */}
        {safePipelines.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {safePipelines.map((pipeline) => (
              <div 
                key={pipeline.id} 
                className="group relative rounded-xl border border-zinc-800 bg-[#131418] hover:border-zinc-700/80 transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md hover:bg-[#16181d]"
              >
                <div className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-zinc-100 group-hover:text-emerald-400 transition-colors tracking-tight text-base truncate">
                      {pipeline.name}
                    </h3>
                    <span 
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                        pipeline.is_active 
                          ? "bg-emerald-950/40 text-emerald-400 border-emerald-800/50" 
                          : "bg-zinc-800/50 text-zinc-400 border-zinc-700/50"
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${pipeline.is_active ? 'bg-emerald-400' : 'bg-zinc-500'}`} />
                      {pipeline.is_active ? "Active" : "Paused"}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-400 line-clamp-2 min-h-[32px]">
                    {pipeline.description || "No description provided for this webhook pipeline."}
                  </p>

                  <div className="rounded-lg bg-[#0a0b0d] border border-zinc-800/80 p-2.5 flex items-center justify-between">
                    <div className="flex flex-col min-w-0 pr-2">
                      <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500">Pipeline Token</span>
                      <span className="font-mono text-xs text-zinc-300 truncate">
                        {pipeline.pipeline_token}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-zinc-800/60 bg-[#0e0f12] px-5 py-3 flex items-center justify-between">
                  <span className="text-[11px] text-zinc-500 font-mono">
                    {new Date(pipeline.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                  <Link 
                    href={`/pipelines/${pipeline.id}`}
                    className="inline-flex items-center gap-1 text-xs font-medium text-zinc-300 hover:text-white transition-colors"
                  >
                    Configure
                    <ArrowUpRight className="h-3.5 w-3.5 opacity-70 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-zinc-800 bg-[#101114]/50 py-16 px-6 text-center space-y-3">
            <div className="h-10 w-10 mx-auto rounded-full bg-zinc-800/60 border border-zinc-700/60 flex items-center justify-center text-zinc-400">
              <SlidersHorizontal className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-zinc-200">No active pipelines</h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                Create your first inbound pipeline to receive webhooks from TradingView, Chartink, or payment gateways.
              </p>
            </div>
            <div className="pt-2">
              <CreatePipelineDialog />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
