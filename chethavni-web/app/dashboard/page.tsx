import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { signout } from '../login/actions'
import { Button } from '@/components/ui/button'
import { CreatePipelineDialog } from '@/components/CreatePipelineDialog'
import { 
  BellRing, 
  Sparkles, 
  ArrowRight, 
  Heart,
  Radio,
  CheckCircle,
  ExternalLink
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

  const alerts = pipelines ?? []
  const liveCount = alerts.filter((a) => a.is_active).length

  return (
    <div className="min-h-screen bg-[#faf8ff] text-slate-800 antialiased font-sans selection:bg-pink-200 selection:text-pink-900">
      {/* Top Navbar */}
      <nav className="border-b border-pink-100 bg-white/80 backdrop-blur-md sticky top-0 z-40">
        <div className="mx-auto max-w-5xl px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-2xl bg-gradient-to-tr from-pink-500 via-rose-400 to-sky-400 flex items-center justify-center shadow-md shadow-pink-200">
              <BellRing className="h-5 w-5 text-white" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 tracking-tight text-lg">Chethavni</span>
              <span className="text-[11px] font-semibold tracking-wide px-2.5 py-0.5 rounded-full bg-pink-50 text-pink-600 border border-pink-200/60">
                {profile?.tier || 'Free'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs font-medium text-slate-500 hidden sm:inline-block">
              {user.email}
            </span>
            <form action={signout}>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-slate-500 hover:text-rose-600 hover:bg-pink-50 rounded-xl text-xs font-medium transition-colors"
              >
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="mx-auto max-w-5xl px-6 py-10 space-y-8">
        {/* Playful Welcome Banner */}
        <div className="relative overflow-hidden rounded-3xl border border-pink-100 bg-gradient-to-br from-pink-100/60 via-purple-50/50 to-sky-100/70 p-7 sm:p-9 shadow-sm">
          <div className="max-w-xl space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 text-pink-600 text-xs font-semibold shadow-xs border border-pink-100">
              <Sparkles className="h-3.5 w-3.5 text-pink-500" />
              Your alert center
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Catch every alert without missing a beat.
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed font-normal">
              Forward Chartink screeners, TradingView alerts, and webhooks straight to Telegram, Discord, and Slack in real time.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-4 pt-4 border-t border-pink-200/50">
            <div className="inline-flex items-center gap-2 bg-white/80 px-3.5 py-1.5 rounded-full text-xs font-medium text-slate-700 shadow-2xs border border-pink-100">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span><strong>{liveCount}</strong> triggers live</span>
            </div>
            <div className="inline-flex items-center gap-2 bg-white/80 px-3.5 py-1.5 rounded-full text-xs font-medium text-slate-700 shadow-2xs border border-sky-100">
              <Radio className="h-3.5 w-3.5 text-sky-500" />
              <span>Instant forward</span>
            </div>
            <div className="inline-flex items-center gap-2 bg-white/80 px-3.5 py-1.5 rounded-full text-xs font-medium text-slate-700 shadow-2xs border border-purple-100">
              <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500" />
              <span>Simple setup</span>
            </div>
          </div>
        </div>

        {/* Section Header */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Your Triggers</h2>
            <p className="text-xs text-slate-500 mt-0.5">Click any trigger to view your webhook link or edit where it sends</p>
          </div>
          <CreatePipelineDialog />
        </div>

        {/* Alerts Grid */}
        {alerts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {alerts.map((alert) => (
              <Link 
                key={alert.id} 
                href={`/pipelines/${alert.id}`}
                className="group relative rounded-2xl border border-slate-200/80 bg-white hover:border-pink-300 hover:shadow-lg hover:shadow-pink-100/50 transition-all duration-200 p-5 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-slate-800 group-hover:text-pink-600 transition-colors text-base truncate">
                      {alert.name}
                    </h3>
                    <span 
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        alert.is_active 
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                          : "bg-slate-100 text-slate-500 border border-slate-200"
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${alert.is_active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      {alert.is_active ? "Live" : "Paused"}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-2 min-h-[32px]">
                    {alert.description || "Active trigger forwarder."}
                  </p>
                </div>

                <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400">Tap to configure</span>
                  <div className="inline-flex items-center gap-1 text-sky-600 group-hover:text-pink-600 font-semibold transition-colors">
                    Manage
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-pink-200 bg-white/70 py-16 px-6 text-center space-y-4">
            <div className="h-12 w-12 mx-auto rounded-2xl bg-pink-50 border border-pink-200 flex items-center justify-center text-pink-500">
              <BellRing className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">No triggers yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Create your first trigger and paste the generated webhook into TradingView or Chartink to start receiving notifications.
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