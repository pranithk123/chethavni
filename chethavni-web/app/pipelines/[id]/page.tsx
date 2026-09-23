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
  CheckCircle,
  Copy
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

  // Fetch all configured destinations for this trigger
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
    const subject = (formData.get('subject') as string) || 'Chethavni Alert'
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
    <div className="min-h-screen bg-[#faf8ff] text-slate-800 antialiased font-sans selection:bg-pink-200 selection:text-pink-900 pb-16">
      <div className="mx-auto max-w-4xl p-6 sm:p-8 space-y-8">
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-pink-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to triggers
          </Link>

          <form action={toggleStatus}>
            <Button
              type="submit"
              variant="outline"
              size="sm"
              className={`rounded-full text-xs font-semibold px-4 border ${
                pipeline.is_active
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Power className="h-3.5 w-3.5 mr-1.5" />
              {pipeline.is_active ? 'Live' : 'Paused'}
            </Button>
          </form>
        </div>

        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {pipeline.name}
          </h1>
          <p className="text-sm text-slate-500">
            {pipeline.description || 'Configured alert forwarder.'}
          </p>
        </div>

        {/* Inbound Webhook URL Card */}
        <div className="rounded-2xl border border-sky-100 bg-gradient-to-r from-sky-50 via-white to-pink-50 p-6 space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sky-800 uppercase tracking-wide">
              Your Webhook URL
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              Paste in TradingView or Chartink
            </span>
          </div>
          <input
            readOnly
            value={webhookUrl}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-mono text-xs text-slate-700 select-all outline-none focus:border-sky-300"
          />
        </div>

        {/* Message Format */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 space-y-4 shadow-xs">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-slate-900">Alert Message Format</h2>
            <p className="text-xs text-slate-500">
              Customize your message. Use <code className="bg-pink-50 text-pink-700 px-1.5 py-0.5 rounded font-mono text-[11px]">{`{{payload}}`}</code> to include the received alert data.
            </p>
          </div>
          <form action={handleUpdateTemplate} className="space-y-3">
            <textarea
              name="template"
              rows={3}
              defaultValue={pipeline.message_template || 'New event received: {{payload}}'}
              className="w-full rounded-xl border border-slate-200 p-3 font-mono text-xs text-slate-800 outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
            />
            <Button
              type="submit"
              size="sm"
              className="rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-semibold text-xs px-4"
            >
              Save Format
            </Button>
          </form>
        </div>

        {/* Channel Integrations */}
        <div className="space-y-5">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900">Where should alerts go?</h2>
            <p className="text-xs text-slate-500">Add the accounts and channels you want alerts sent to.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Telegram Channel */}
            <div className="rounded-2xl border border-sky-200/60 bg-white p-5 space-y-3 shadow-xs">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-sky-50 text-sky-500 flex items-center justify-center font-bold text-sm">
                  ✈
                </div>
                <h3 className="text-xs font-bold text-slate-900">Telegram Bot</h3>
              </div>
              <form action={handleAddTelegram} className="space-y-2">
                <Input
                  name="bot_token"
                  placeholder="Bot Token (e.g. 123456:ABC-DEF12456)"
                  required
                  className="rounded-xl text-xs bg-slate-50/50 border-slate-200 font-mono"
                />
                <Input
                  name="chat_id"
                  placeholder="Chat ID or Channel ID (e.g. -100123456789)"
                  required
                  className="rounded-xl text-xs bg-slate-50/50 border-slate-200 font-mono"
                />
                <Button
                  type="submit"
                  size="sm"
                  className="w-full rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold"
                >
                  Connect Telegram
                </Button>
              </form>
              {telegramDests.map((d) => (
                <div key={d.id} className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-600 text-[11px] truncate">
                    Chat: {d.config?.chat_id}
                  </span>
                  <form action={handleDeleteDestination.bind(null, d.id)}>
                    <Button type="submit" variant="ghost" size="sm" className="h-6 w-6 p-0 text-slate-400 hover:text-rose-500">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </form>
                </div>
              ))}
            </div>

            {/* Discord Channel */}
            <div className="rounded-2xl border border-indigo-200/60 bg-white p-5 space-y-3 shadow-xs">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center font-bold text-sm">
                  #
                </div>
                <h3 className="text-xs font-bold text-slate-900">Discord Channel</h3>
              </div>
              <form action={handleAddDiscord} className="space-y-2">
                <Input
                  name="webhook_url"
                  placeholder="Discord Webhook URL (from Channel Integrations)"
                  required
                  className="rounded-xl text-xs bg-slate-50/50 border-slate-200 font-mono"
                />
                <Button
                  type="submit"
                  size="sm"
                  className="w-full rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold"
                >
                  Connect Discord
                </Button>
              </form>
              {discordDests.map((d) => (
                <div key={d.id} className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-600 text-[11px] truncate">
                    Discord Webhook Connected
                  </span>
                  <form action={handleDeleteDestination.bind(null, d.id)}>
                    <Button type="submit" variant="ghost" size="sm" className="h-6 w-6 p-0 text-slate-400 hover:text-rose-500">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </form>
                </div>
              ))}
            </div>

            {/* Slack Channel */}
            <div className="rounded-2xl border border-emerald-200/60 bg-white p-5 space-y-3 shadow-xs">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Send className="h-4 w-4" />
                </div>
                <h3 className="text-xs font-bold text-slate-900">Slack Webhook</h3>
              </div>
              <form action={handleAddSlack} className="space-y-2">
                <Input
                  name="webhook_url"
                  placeholder="https://hooks.slack.com/services/..."
                  required
                  className="rounded-xl text-xs bg-slate-50/50 border-slate-200 font-mono"
                />
                <Button
                  type="submit"
                  size="sm"
                  className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                >
                  Connect Slack
                </Button>
              </form>
              {slackDests.map((d) => (
                <div key={d.id} className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-600 text-[11px] truncate">
                    Slack Webhook Connected
                  </span>
                  <form action={handleDeleteDestination.bind(null, d.id)}>
                    <Button type="submit" variant="ghost" size="sm" className="h-6 w-6 p-0 text-slate-400 hover:text-rose-500">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </form>
                </div>
              ))}
            </div>

            {/* Email (User's Resend Account) */}
            <div className="rounded-2xl border border-pink-200/60 bg-white p-5 space-y-3 shadow-xs">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center">
                  <Mail className="h-4 w-4" />
                </div>
                <h3 className="text-xs font-bold text-slate-900">Email (Resend)</h3>
              </div>
              <form action={handleAddEmail} className="space-y-2">
                <Input
                  name="api_key"
                  type="password"
                  placeholder="Your Resend API Key (re_...)"
                  required
                  className="rounded-xl text-xs bg-slate-50/50 border-slate-200 font-mono"
                />
                <Input
                  name="to"
                  type="email"
                  placeholder="Recipient Email (you@domain.com)"
                  required
                  className="rounded-xl text-xs bg-slate-50/50 border-slate-200"
                />
                <Input
                  name="subject"
                  placeholder="Subject line (optional)"
                  className="rounded-xl text-xs bg-slate-50/50 border-slate-200"
                />
                <Button
                  type="submit"
                  size="sm"
                  className="w-full rounded-xl bg-pink-500 hover:bg-pink-600 text-white text-xs font-semibold"
                >
                  Connect Email
                </Button>
              </form>
              {emailDests.map((d) => (
                <div key={d.id} className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-600 text-[11px] truncate">
                    To: {d.config?.to}
                  </span>
                  <form action={handleDeleteDestination.bind(null, d.id)}>
                    <Button type="submit" variant="ghost" size="sm" className="h-6 w-6 p-0 text-slate-400 hover:text-rose-500">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </form>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Custom Webhook Forwarder */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 space-y-3 shadow-xs">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Globe className="h-4 w-4" />
            </div>
            <h3 className="text-xs font-bold text-slate-900">Custom Webhook Forwarder</h3>
          </div>
          <form action={handleAddWebhook} className="space-y-2">
            <Input
              name="endpoint_url"
              placeholder="https://api.yourdomain.com/v1/webhook"
              required
              className="rounded-xl text-xs bg-slate-50/50 border-slate-200 font-mono"
            />
            <Button
              type="submit"
              size="sm"
              className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold px-4"
            >
              Add Forwarder
            </Button>
          </form>
          {webhookDests.map((d) => (
            <div key={d.id} className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="font-mono text-slate-600 text-[11px] truncate">
                {d.config?.endpoint_url}
              </span>
              <form action={handleDeleteDestination.bind(null, d.id)}>
                <Button type="submit" variant="ghost" size="sm" className="h-6 w-6 p-0 text-slate-400 hover:text-rose-500">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </form>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}