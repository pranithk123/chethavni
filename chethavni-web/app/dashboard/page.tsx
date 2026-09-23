import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { signout } from '../login/actions'
import { Button } from '@/components/ui/button'
import { CreatePipelineDialog } from '@/components/CreatePipelineDialog'
import { 
  Bell, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  ExternalLink,
  ShieldCheck,
  Zap
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

  const safeAlerts = pipelines ?? []
  const activeCount = safeAlerts.filter((p) => p.is_active).length

  return (
    <div className="min-h-screen bg-[#0e0f12] text-zinc-100 antialiased font-sans selection:bg-amber-500/20 selection:text-amber-200">
      {/* Top Navbar */}
      <nav className="border-b border-zinc-800/60 bg-[#131419]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="mx-auto max-w-5xl px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/10">
              <Bell className="h-5 w-5 text-zinc-950 stroke-[2.5]" />
            </div>
            <div>
              <span className="font-semibold text-white tracking-tight text-base">Chethavni</span>
              <span className="ml-2 text-[10px] font-medium tracking-wide uppercase px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700/60">
                {profile?.tier || 'Free Plan'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs text-zinc-400 hidden sm:inline-block">
              {user.email}
            </span>
            <form action={signout}>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg text-xs"
              >
                Log out
              </Button>
            </form>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="mx-auto max-w-5xl px-6 py-10 space-y-8">
        {/* Friendly Welcome Card */}
        <section className="relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-gradient-to-br from-[#16181f] via-[#121318] to-[#0e0f12] p-6 sm:p-8">
          <div className="max-w-xl space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 text-xs font-medium border border-amber-500/20">
              <Sparkles className="h-3.5 w-3.5" /> Ready to route signals
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Instant alerts, zero missed trades.
            </h1>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Connect Chartink, TradingView, or webhooks directly into your private Telegram or Discord channels.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-4 pt-4 border-t border-zinc-800/60">
            <div className="flex items-center gap-2 text-xs text-zinc-300">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span><strong>{activeCount}</strong> active triggers</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-300">
              <Zap className="h-4 w-4 text-amber-400" />
              <span>Sub-second instant routing</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-300">
              <ShieldCheck className="h-4 w-4 text-blue-400" />
              <span>Private & secure</span>
            </div>
          </div>
        </section>

        {/* Section Header */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <h2 className="text-lg font-semibold text-white tracking-tight">Your Alert Triggers</h2>
            <p className="text-xs text-zinc-400">Click any alert below to grab its webhook link or adjust settings</p>
          </div>
          <CreatePipelineDialog />
        </div>

        {/* Alerts Cards Grid */}
        {safeAlerts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {safeAlerts.map((alert) => (
              <Link 
                key={alert.id} 
                href={`/pipelines/${alert.id}`}
                className="group relative rounded-xl border border-zinc-800/80 bg-[#14151b] hover:bg-[#181a22] hover:border-zinc-700/80 transition-all duration-200 p-5 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-zinc-100 group-hover:text-amber-300 transition-colors text-base truncate">
                      {alert.name}
                    </h3>
                    <span 
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                        alert.is_active 
                          ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20" 
                          : "bg-zinc-800 text-zinc-400 border border-zinc-700/50"
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${alert.is_active ? 'bg-emerald-400' : 'bg-zinc-500'}`} />
                      {alert.is_active ? "Live" : "Paused"}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-400 line-clamp-2 min-h-[32px]">
                    {alert.description || "Sends alerts as soon as an event triggers."}
                  </p>
                </div>

                <div className="pt-4 mt-2 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-400">
                  <span className="text-[11px]">Tap to configure</span>
                  <div className="inline-flex items-center gap-1 text-zinc-300 group-hover:text-white font-medium">
                    Settings
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-zinc-800 bg-[#121318]/50 py-16 px-6 text-center space-y-4">
            <div className="h-12 w-12 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-300">
              <Bell className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-zinc-200">No alerts set up yet</h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                Create your first alert trigger and paste the link into Chartink or TradingView to start getting notifications.
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