import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  ArrowLeft, 
  Send, 
  Mail, 
  Globe, 
  Power, 
  Trash2,
  Sparkles,
  Zap,
  CheckCircle,
  Copy,
  TrendingUp,
  CreditCard,
  ShoppingBag,
  Bell
} from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function PipelineDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: pipeline } = await supabase
    .from('pipelines')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!pipeline) {
    notFound()
  }

  // Fetch all destinations configured for this trigger
  const { data: destinations } = await supabase
    .from('destinations')
    .select('*')
    .eq('pipeline_id', id)
    .order('created_at', { ascending: false })

  const safeDestinations = destinations ?? []
  const telegramDests = safeDestinations.filter((d) => d.channel === 'telegram')
  const discordDests = safeDestinations.filter((d) => d.channel === 'discord')
  const slackDests = safeDestinations.filter((d) => d.channel === 'slack')
  const emailDests = safeDestinations.filter((d) => d.channel === 'email')
  const webhookDests = safeDestinations.filter((d) => d.channel === 'webhook')

  const { data: logs } = await supabase
    .from('alert_logs')
    .select('*')
    .eq('pipeline_id', id)
    .order('created_at', { ascending: false })
    .limit(10)

  const engineBaseUrl =
    process.env.NEXT_PUBLIC_ENGINE_BASE_URL ||
    'https://chethavni-production.up.railway.app'
  const webhookUrl = `${engineBaseUrl}/v1/hook/${pipeline.pipeline_token}`

  // Server Actions
  async function toggleStatus() {
    'use server'
    const sb = await createClient()
    await sb
      .from('pipelines')
      .update({ is_active: !pipeline.is_active })
      .eq('id', id)
    revalidatePath(`/pipelines/${id}`)
    revalidatePath('/dashboard')
  }

  async function handleUpdateTemplate(formData: FormData) {
    'use server'
    const template = formData.get('template') as string
    const sb = await createClient()
    await sb
      .from('pipelines')
      .update({ message_template: template })
      .eq('id', id)
    revalidatePath(`/pipelines/${id}`)
  }

  async function handleAddTelegram(formData: FormData) {
    'use server'
    const botToken = formData.get('bot_token') as string
    const chatID = formData.get('chat_id') as string
    const sb = await createClient()
    await sb.from('destinations').insert({
      pipeline_id: id,
      channel: 'telegram',
      is_enabled: true,
      config: { bot_token: botToken, chat_id: chatID },
    })
    revalidatePath(`/pipelines/${id}`)
  }

  async function handleAddDiscord(formData: FormData) {
    'use server'
    const webhookURL = formData.get('webhook_url') as string
    const sb = await createClient()
    await sb.from('destinations').insert({
      pipeline_id: id,
      channel: 'discord',
      is_enabled: true,
      config: { webhook_url: webhookURL },
    })
    revalidatePath(`/pipelines/${id}`)
  }

  async function handleAddSlack(formData: FormData) {
    'use server'
    const webhookURL = formData.get('webhook_url') as string
    const sb = await createClient()
    await sb.from('destinations').insert({
      pipeline_id: id,
      channel: 'slack',
      is_enabled: true,
      config: { webhook_url: webhookURL },
    })
    revalidatePath(`/pipelines/${id}`)
  }

  async function handleAddEmail(formData: FormData) {
    'use server'
    const apiKey = formData.get('api_key') as string
    const to = formData.get('to') as string
    const subject = (formData.get('subject') as string) || 'Chethavni Notification'
    const sb = await createClient()
    await sb.from('destinations').insert({
      pipeline_id: id,
      channel: 'email',
      is_enabled: true,
      config: { api_key: apiKey, to: to, subject: subject },
    })
    revalidatePath(`/pipelines/${id}`)
  }

  async function handleAddWebhook(formData: FormData) {
    'use server'
    const endpoint = formData.get('endpoint_url') as string
    const sb = await createClient()
    await sb.from('destinations').insert({
      pipeline_id: id,
      channel: 'webhook',
      is_enabled: true,
      config: { endpoint_url: endpoint },
    })
    revalidatePath(`/pipelines/${id}`)
  }

  async function handleDeleteDestination(destId: string) {
    'use server'
    const sb = await createClient()
    await sb.from('destinations').delete().eq('id', destId).eq('pipeline_id', id)
    revalidatePath(`/pipelines/${id}`)
  }

  return (
    <div className="min-h-screen bg-[#fcfaff] text-slate-800 font-sans pb-20 selection:bg-pink-200">
      {/* Top Bar */}
      <header className="border-b border-pink-100/80 bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <div className="mx-auto max-w-5xl px-6 h-16 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-pink-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>

          <form action={toggleStatus}>
            <Button
              type="submit"
              variant="outline"
              size="sm"
              className={`rounded-full text-xs font-semibold px-4 transition-all ${
                pipeline.is_active
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Power className="h-3.5 w-3.5 mr-1.5" />
              {pipeline.is_active ? 'Status: Live' : 'Status: Paused'}
            </Button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10 space-y-10">
        {/* Title Area */}
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-50 border border-pink-200/60 text-xs font-bold text-pink-600">
            <Zap className="h-3.5 w-3.5 text-pink-500 fill-pink-500" />
            Sub-millisecond Webhook Relay
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            {pipeline.name}
          </h1>
          <p className="text-base text-slate-500">
            {pipeline.description || 'Incoming webhook alerts forward automatically.'}
          </p>
        </div>

        {/* Inbound Webhook URL (Paste into TradingView, Razorpay, Chartink) */}
        <div className="rounded-3xl border border-sky-200/80 bg-gradient-to-r from-sky-50 via-indigo-50/40 to-pink-50 p-7 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <span className="text-xs font-black tracking-wider uppercase text-sky-800">
                Your Inbound Webhook URL
              </span>
              <p className="text-xs text-slate-500 mt-0.5">
                Paste this destination URL into TradingView alerts, Razorpay webhooks, or Chartink screeners
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-slate-700 text-xs font-semibold shadow-xs border border-sky-100 self-start sm:self-auto">
              <CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> Auto-ready
            </span>
          </div>

          <div className="relative">
            <input
              readOnly
              value={webhookUrl}
              className="w-full rounded-2xl border border-sky-200 bg-white px-4 py-3.5 font-mono text-sm text-slate-800 shadow-inner select-all outline-none focus:border-sky-400"
            />
          </div>
        </div>

        {/* High-Demand Source Presets & Custom Message Format */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-sm space-y-5">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900">Alert Message Format</h2>
            <p className="text-sm text-slate-500">
              Customize what gets posted to your chat. Write plain text or use variables from your incoming payload like <code className="bg-pink-50 text-pink-600 font-mono px-1.5 py-0.5 rounded text-xs">{`{{payload}}`}</code>.
            </p>
          </div>

          {/* Quick 1-Click Fill Helper Prompts */}
          <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 space-y-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Quick Presets (Click to see syntax):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              <div className="p-2.5 bg-white rounded-xl border border-slate-200/70 space-y-1">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-blue-500" /> TradingView
                </div>
                <p className="text-[11px] text-slate-500 font-mono truncate">{`{{ticker}} {{strategy.order.action}} @ {{close}}`}</p>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-slate-200/70 space-y-1">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Bell className="h-3.5 w-3.5 text-amber-500" /> Chartink
                </div>
                <p className="text-[11px] text-slate-500 font-mono truncate">{`Scan alert: {{stocks}} triggered!`}</p>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-slate-200/70 space-y-1">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <CreditCard className="h-3.5 w-3.5 text-emerald-500" /> Razorpay
                </div>
                <p className="text-[11px] text-slate-500 font-mono truncate">{`Payment ₹{{payload.payment.entity.amount}} received`}</p>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-slate-200/70 space-y-1">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <ShoppingBag className="h-3.5 w-3.5 text-purple-500" /> Shopify
                </div>
                <p className="text-[11px] text-slate-500 font-mono truncate">{"New order #{{id}} for ${{total_price}}"}</p>
              </div>
            </div>
          </div>

          <form action={handleUpdateTemplate} className="space-y-3">
            <textarea
              name="template"
              rows={3}
              defaultValue={pipeline.message_template || 'Alert: {{payload}}'}
              className="w-full rounded-2xl border border-slate-200 p-4 font-mono text-sm text-slate-800 outline-none focus:border-pink-300 focus:ring-4 focus:ring-pink-50"
            />
            <Button
              type="submit"
              size="sm"
              className="rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-semibold text-xs px-5 py-2.5 shadow-sm shadow-pink-200"
            >
              Save Message Format
            </Button>
          </form>
        </div>

        {/* Outbound Destinations Grid */}
        <div className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Where Should We Forward Your Alerts?
            </h2>
            <p className="text-sm text-slate-500">
              Add as many personal channels as you want. When an alert arrives, Chethavni fans out to all connected destinations in parallel.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Telegram Channel */}
            <div className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm space-y-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-sky-50 text-sky-500 flex items-center justify-center font-bold text-lg shadow-xs">
                  ✈
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Telegram Bot & Channel</h3>
                  <p className="text-xs text-slate-500">Instant messages to your private channel or group</p>
                </div>
              </div>
              <form action={handleAddTelegram} className="space-y-2.5">
                <Input
                  name="bot_token"
                  placeholder="Bot Token (e.g. 123456:ABC-DEF12456)"
                  required
                  className="rounded-xl text-xs bg-slate-50 border-slate-200 font-mono py-2.5"
                />
                <Input
                  name="chat_id"
                  placeholder="Chat ID or Channel ID (e.g. -100123456789)"
                  required
                  className="rounded-xl text-xs bg-slate-50 border-slate-200 font-mono py-2.5"
                />
                <Button
                  type="submit"
                  size="sm"
                  className="w-full rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold py-2.5 shadow-xs"
                >
                  Connect Telegram
                </Button>
              </form>
              {telegramDests.map((d) => (
                <div key={d.id} className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-700 text-xs truncate">
                    Chat ID: {d.config?.chat_id}
                  </span>
                  <form action={handleDeleteDestination.bind(null, d.id)}>
                    <Button type="submit" variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400 hover:text-rose-500">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              ))}
            </div>

            {/* Discord Channel */}
            <div className="rounded-3xl border border-indigo-100 bg-white p-6 shadow-sm space-y-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center font-bold text-lg shadow-xs">
                  #
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Discord Channel</h3>
                  <p className="text-xs text-slate-500">From Channel Settings → Integrations → Webhooks</p>
                </div>
              </div>
              <form action={handleAddDiscord} className="space-y-2.5">
                <Input
                  name="webhook_url"
                  placeholder="Discord Webhook URL (https://discord.com/api/webhooks/...)"
                  required
                  className="rounded-xl text-xs bg-slate-50 border-slate-200 font-mono py-2.5"
                />
                <Button
                  type="submit"
                  size="sm"
                  className="w-full rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold py-2.5 shadow-xs"
                >
                  Connect Discord
                </Button>
              </form>
              {discordDests.map((d) => (
                <div key={d.id} className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-700 text-xs truncate max-w-xs">
                    {d.config?.webhook_url}
                  </span>
                  <form action={handleDeleteDestination.bind(null, d.id)}>
                    <Button type="submit" variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400 hover:text-rose-500">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              ))}
            </div>

            {/* Slack Channel */}
            <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm space-y-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-xs">
                  <Send className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Slack Webhook</h3>
                  <p className="text-xs text-slate-500">Posts notifications into your team's Slack channel</p>
                </div>
              </div>
              <form action={handleAddSlack} className="space-y-2.5">
                <Input
                  name="webhook_url"
                  placeholder="https://hooks.slack.com/services/..."
                  required
                  className="rounded-xl text-xs bg-slate-50 border-slate-200 font-mono py-2.5"
                />
                <Button
                  type="submit"
                  size="sm"
                  className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 shadow-xs"
                >
                  Connect Slack
                </Button>
              </form>
              {slackDests.map((d) => (
                <div key={d.id} className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-700 text-xs truncate max-w-xs">
                    {d.config?.webhook_url}
                  </span>
                  <form action={handleDeleteDestination.bind(null, d.id)}>
                    <Button type="submit" variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400 hover:text-rose-500">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              ))}
            </div>

            {/* Email via User's Resend Account */}
            <div className="rounded-3xl border border-pink-100 bg-white p-6 shadow-sm space-y-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center shadow-xs">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Email Notification (Resend)</h3>
                  <p className="text-xs text-slate-500">Uses your Resend API key so emails send from your domain</p>
                </div>
              </div>
              <form action={handleAddEmail} className="space-y-2.5">
                <Input
                  name="api_key"
                  type="password"
                  placeholder="Your Resend API Key (re_...)"
                  required
                  className="rounded-xl text-xs bg-slate-50 border-slate-200 font-mono py-2.5"
                />
                <Input
                  name="to"
                  type="email"
                  placeholder="Recipient Email (ops@company.com)"
                  required
                  className="rounded-xl text-xs bg-slate-50 border-slate-200 font-mono py-2.5"
                />
                <Input
                  name="subject"
                  placeholder="Custom Subject line (optional)"
                  className="rounded-xl text-xs bg-slate-50 border-slate-200 py-2.5"
                />
                <Button
                  type="submit"
                  size="sm"
                  className="w-full rounded-xl bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold py-2.5 shadow-xs"
                >
                  Connect Email
                </Button>
              </form>
              {emailDests.map((d) => (
                <div key={d.id} className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-700 text-xs truncate">
                    To: {d.config?.to}
                  </span>
                  <form action={handleDeleteDestination.bind(null, d.id)}>
                    <Button type="submit" variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400 hover:text-rose-500">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Custom Webhook Forwarder (Fanout to another backend) */}
        <div className="rounded-3xl border border-purple-100 bg-white p-7 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-xs">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Custom Webhook Forwarder (Fanout)</h3>
              <p className="text-xs text-slate-500">Forward incoming alerts to any custom API or microservice URL</p>
            </div>
          </div>
          <form action={handleAddWebhook} className="space-y-3">
            <Input
              name="endpoint_url"
              placeholder="https://api.yourdomain.com/v1/webhook"
              required
              className="rounded-xl text-xs bg-slate-50 border-slate-200 font-mono py-2.5"
            />
            <Button
              type="submit"
              size="sm"
              className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-5 py-2.5 shadow-xs"
            >
              Add Forwarder URL
            </Button>
          </form>
          {webhookDests.map((d) => (
            <div key={d.id} className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="font-mono text-slate-700 text-xs truncate">
                {d.config?.endpoint_url}
              </span>
              <form action={handleDeleteDestination.bind(null, d.id)}>
                <Button type="submit" variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400 hover:text-rose-500">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </form>
            </div>
          ))}
        </div>

        {/* Live Ingestion Logs */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Recent Deliveries</h2>
            <span className="text-xs text-slate-400 font-medium">Last 10 events</span>
          </div>
          {logs && logs.length > 0 ? (
            <div className="space-y-2">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-2xl bg-slate-50 p-4 text-xs flex items-center justify-between border border-slate-100"
                >
                  <span className="font-mono text-slate-700 truncate max-w-lg">
                    {log.raw_payload}
                  </span>
                  <span className="text-xs text-slate-400 font-medium shrink-0 ml-4">
                    {new Date(log.created_at).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <p className="text-xs text-slate-400 font-medium">No alerts received yet. Send a test webhook to see it appear here in real time!</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}