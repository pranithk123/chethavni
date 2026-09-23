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
  Power 
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

  const { data: slackChannels } = await supabase
    .from('slack_channels')
    .select('*')
    .eq('pipeline_id', id)

  const { data: emailRecipients } = await supabase
    .from('email_recipients')
    .select('*')
    .eq('pipeline_id', id)

  const { data: webhookForwarders } = await supabase
    .from('webhook_forwarders')
    .select('*')
    .eq('pipeline_id', id)

  const { data: logs } = await supabase
    .from('alert_logs')
    .select('*')
    .eq('pipeline_id', id)
    .order('created_at', { ascending: false })
    .limit(20)

  const engineBaseUrl =
    process.env.NEXT_PUBLIC_ENGINE_BASE_URL ||
    'https://chethavni-production.up.railway.app'
  const webhookUrl = `${engineBaseUrl}/v1/hook/${pipeline.pipeline_token}`

  // Inline Server Actions
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

  async function handleAddSlack(formData: FormData) {
    'use server'
    const webhookUrl = formData.get('webhook_url') as string
    const sb = await createClient()
    await sb.from('slack_channels').insert({
      pipeline_id: id,
      webhook_url: webhookUrl,
    })
    revalidatePath(`/pipelines/${id}`)
  }

  async function handleAddEmail(formData: FormData) {
    'use server'
    const email = formData.get('email') as string
    const sb = await createClient()
    await sb.from('email_recipients').insert({
      pipeline_id: id,
      email: email,
    })
    revalidatePath(`/pipelines/${id}`)
  }

  async function handleAddForwarder(formData: FormData) {
    'use server'
    const targetUrl = formData.get('target_url') as string
    const sb = await createClient()
    await sb.from('webhook_forwarders').insert({
      pipeline_id: id,
      target_url: targetUrl,
    })
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
            Back to alerts
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
            {pipeline.description || 'Configured alert trigger.'}
          </p>
        </div>

        {/* Webhook Endpoint Card */}
        <div className="rounded-2xl border border-sky-100 bg-gradient-to-r from-sky-50/80 via-white to-pink-50/60 p-6 space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sky-800 uppercase tracking-wide">
              Your Webhook URL
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              Paste into TradingView or Chartink
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={webhookUrl}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-mono text-xs text-slate-700 select-all outline-none focus:border-sky-300"
            />
          </div>
        </div>

        {/* Message Format Card */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 space-y-4 shadow-xs">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-slate-900">Alert Message Format</h2>
            <p className="text-xs text-slate-500">
              Customize what gets sent. Use <code className="bg-pink-50 text-pink-700 px-1 py-0.5 rounded font-mono text-[11px]">{`{{payload}}`}</code> to output the incoming alert.
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

        {/* Channels Section */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-900">Where should alerts go?</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Slack Channel */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 space-y-3 shadow-xs">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                  <Send className="h-4 w-4" />
                </div>
                <h3 className="text-xs font-bold text-slate-900">Slack Webhook</h3>
              </div>
              <form action={handleAddSlack} className="space-y-2">
                <Input
                  name="webhook_url"
                  placeholder="https://hooks.slack.com/services/..."
                  required
                  className="rounded-xl text-xs bg-slate-50/50 border-slate-200"
                />
                <Button
                  type="submit"
                  size="sm"
                  className="w-full rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold"
                >
                  Connect Slack
                </Button>
              </form>
              {slackChannels && slackChannels.length > 0 && (
                <div className="pt-2 border-t border-slate-100 space-y-1">
                  {slackChannels.map((c) => (
                    <div key={c.id} className="text-[11px] font-mono text-slate-500 truncate">
                      ✓ {c.webhook_url}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Email Alert */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 space-y-3 shadow-xs">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center">
                  <Mail className="h-4 w-4" />
                </div>
                <h3 className="text-xs font-bold text-slate-900">Email Notification</h3>
              </div>
              <form action={handleAddEmail} className="space-y-2">
                <Input
                  name="email"
                  type="email"
                  placeholder="you@domain.com"
                  required
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
              {emailRecipients && emailRecipients.length > 0 && (
                <div className="pt-2 border-t border-slate-100 space-y-1">
                  {emailRecipients.map((e) => (
                    <div key={e.id} className="text-[11px] text-slate-500">
                      ✓ {e.email}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Webhook Forwarding */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 space-y-3 shadow-xs">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Globe className="h-4 w-4" />
            </div>
            <h3 className="text-xs font-bold text-slate-900">Forward to Another Webhook</h3>
          </div>
          <form action={handleAddForwarder} className="space-y-2">
            <Input
              name="target_url"
              placeholder="https://api.yourdomain.com/v1/webhook"
              required
              className="rounded-xl text-xs bg-slate-50/50 border-slate-200"
            />
            <Button
              type="submit"
              size="sm"
              className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold px-4"
            >
              Add Forwarder URL
            </Button>
          </form>
          {webhookForwarders && webhookForwarders.length > 0 && (
            <div className="pt-2 border-t border-slate-100 space-y-1">
              {webhookForwarders.map((w) => (
                <div key={w.id} className="text-[11px] font-mono text-slate-500 truncate">
                  ✓ {w.target_url}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Deliveries */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 space-y-3 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900">Recent Deliveries</h2>
          {logs && logs.length > 0 ? (
            <div className="space-y-2">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-xl bg-slate-50 p-3 text-xs flex items-center justify-between border border-slate-100"
                >
                  <span className="font-mono text-slate-600 truncate max-w-md">
                    {log.raw_payload}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {new Date(log.created_at).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400">No alert deliveries recorded yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}