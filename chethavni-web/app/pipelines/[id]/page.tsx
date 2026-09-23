import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CopyButton } from '@/components/ui/copy-button'
import { DeleteDestinationButton } from '@/components/DeleteDestinationButton'
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Code2,
  Globe2,
  Mail,
  MessageCircle,
  Power,
  Send,
  Webhook,
  Zap,
} from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

const integrations = [
  {
    key: 'telegram',
    name: 'Telegram',
    description: 'Send a message to a chat or channel.',
    icon: Send,
    tone: 'sky',
  },
  {
    key: 'discord',
    name: 'Discord',
    description: 'Post a notification through a webhook.',
    icon: MessageCircle,
    tone: 'violet',
  },
  {
    key: 'slack',
    name: 'Slack',
    description: 'Send messages to a Slack channel.',
    icon: MessageCircle,
    tone: 'indigo',
  },
  {
    key: 'email',
    name: 'Email',
    description: 'Send an email using your Resend account.',
    icon: Mail,
    tone: 'sky',
  },
  {
    key: 'webhook',
    name: 'HTTP Request',
    description: 'Call any API or webhook endpoint.',
    icon: Globe2,
    tone: 'violet',
  },
]

function toneClasses(tone: string) {
  return {
    sky: 'bg-sky-50 text-sky-600 ring-sky-100',
    violet: 'bg-violet-50 text-violet-600 ring-violet-100',
    indigo: 'bg-indigo-50 text-indigo-600 ring-indigo-100',
  }[tone] || 'bg-slate-50 text-slate-600 ring-slate-100'
}

export default async function PipelineDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: pipeline } = await supabase
    .from('pipelines')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!pipeline) notFound()

  const { data: destinations } = await supabase
    .from('destinations')
    .select('*')
    .eq('pipeline_id', id)
    .order('created_at', { ascending: false })

  const safeDestinations = destinations ?? []
  const engineBaseUrl =
    process.env.NEXT_PUBLIC_ENGINE_BASE_URL ||
    'https://chethavni-production.up.railway.app'
  const webhookUrl = `${engineBaseUrl}/v1/hook/${pipeline.pipeline_token}`

  async function toggleStatus() {
    'use server'
    const sb = await createClient()
    await sb.from('pipelines').update({ is_active: !pipeline.is_active }).eq('id', id)
    revalidatePath(`/pipelines/${id}`)
    revalidatePath('/dashboard')
  }

  async function handleUpdateTemplate(formData: FormData) {
    'use server'
    const template = formData.get('template') as string
    const sb = await createClient()
    await sb.from('pipelines').update({ message_template: template }).eq('id', id)
    revalidatePath(`/pipelines/${id}`)
  }

  async function handleAddTelegram(formData: FormData) {
    'use server'
    const sb = await createClient()
    await sb.from('destinations').insert({
      pipeline_id: id,
      channel: 'telegram',
      config: {
        bot_token: String(formData.get('bot_token') || ''),
        chat_id: String(formData.get('chat_id') || ''),
      },
      is_enabled: true,
    })
    revalidatePath(`/pipelines/${id}`)
  }

  async function handleAddDiscord(formData: FormData) {
    'use server'
    const sb = await createClient()
    await sb.from('destinations').insert({
      pipeline_id: id,
      channel: 'discord',
      config: { webhook_url: String(formData.get('webhook_url') || '') },
      is_enabled: true,
    })
    revalidatePath(`/pipelines/${id}`)
  }

  async function handleAddSlack(formData: FormData) {
    'use server'
    const sb = await createClient()
    await sb.from('destinations').insert({
      pipeline_id: id,
      channel: 'slack',
      config: { webhook_url: String(formData.get('webhook_url') || '') },
      is_enabled: true,
    })
    revalidatePath(`/pipelines/${id}`)
  }

  async function handleAddEmail(formData: FormData) {
    'use server'
    const sb = await createClient()
    await sb.from('destinations').insert({
      pipeline_id: id,
      channel: 'email',
      config: {
        api_key: String(formData.get('api_key') || ''),
        to: String(formData.get('to') || ''),
        subject: String(formData.get('subject') || 'Chethavni Notification'),
      },
      is_enabled: true,
    })
    revalidatePath(`/pipelines/${id}`)
  }

  async function handleAddWebhook(formData: FormData) {
    'use server'
    const sb = await createClient()
    await sb.from('destinations').insert({
      pipeline_id: id,
      channel: 'webhook',
      config: {
        endpoint_url: String(formData.get('endpoint_url') || ''),
        secret: String(formData.get('secret') || ''),
      },
      is_enabled: true,
    })
    revalidatePath(`/pipelines/${id}`)
  }

  const configuredKeys = new Set(safeDestinations.map((destination) => destination.channel))

  return (
    <div className="min-h-screen bg-[#f8fbff] pb-20 text-slate-800">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5 sm:px-7">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition hover:text-sky-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Workflows
          </Link>

          <form action={toggleStatus}>
            <Button
              type="submit"
              variant="outline"
              size="sm"
              className={`h-8 rounded-lg px-3 text-xs font-semibold ${
                pipeline.is_active
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
              }`}
            >
              <Power className="mr-1.5 h-3.5 w-3.5" />
              {pipeline.is_active ? 'Active' : 'Paused'}
            </Button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-7 px-5 py-8 sm:px-7 sm:py-10">
        <section>
          <div className="flex items-start gap-3">
            <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600 ring-1 ring-sky-100">
              <Zap className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sky-600">
                Workflow
              </p>
              <h1 className="mt-1 truncate text-2xl font-bold tracking-tight text-slate-950">
                {pipeline.name}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                {pipeline.description || 'Connect an incoming event to one or more actions.'}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-sky-100 bg-white p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Webhook className="h-4 w-4 text-sky-600" />
                <h2 className="text-sm font-semibold text-slate-900">Trigger</h2>
              </div>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Send a POST request from any service that can call a webhook. Chartink, TradingView,
                your own application, or another automation platform can use this endpoint.
              </p>
            </div>
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-100">
              <Check className="h-3 w-3" />
              Ready
            </span>
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <input
              readOnly
              value={webhookUrl}
              className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 font-mono text-[11px] text-slate-700 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-50"
            />
            <CopyButton value={webhookUrl} />
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {['Chartink', 'TradingView', 'Custom webhook', 'Pabbly / Zapier'].map((source) => (
              <span key={source} className="rounded-md bg-slate-50 px-2 py-1 text-[10px] font-medium text-slate-500 ring-1 ring-slate-100">
                {source}
              </span>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600 ring-1 ring-violet-100">
              <Code2 className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Data format</h2>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Use values from the incoming JSON payload in your outgoing message with variables such as <code className="rounded bg-slate-50 px-1 py-0.5 font-mono text-[10px] text-violet-600">{'{{ticker}}'}</code> or <code className="rounded bg-slate-50 px-1 py-0.5 font-mono text-[10px] text-violet-600">{'{{payload}}'}</code>.
              </p>
            </div>
          </div>

          <form action={handleUpdateTemplate} className="mt-4 space-y-3">
            <textarea
              name="template"
              rows={4}
              defaultValue={pipeline.message_template || 'Alert: {{payload}}'}
              className="w-full resize-y rounded-lg border border-slate-200 bg-slate-50 p-3 font-mono text-xs leading-5 text-slate-700 outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-50"
            />
            <Button type="submit" size="sm" className="h-8 rounded-lg bg-sky-50 px-3 text-xs font-semibold text-sky-700 ring-1 ring-sky-200 hover:bg-sky-100">
              Save format
            </Button>
          </form>
        </section>

        <section>
          <div className="mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-950">Actions & integrations</h2>
              <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-600 ring-1 ring-violet-100">
                {safeDestinations.length} connected
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Connect the apps or APIs that should receive data when this workflow runs.
            </p>
          </div>

          <div className="space-y-3">
            {integrations.map((integration) => {
              const Icon = integration.icon
              const connected = configuredKeys.has(integration.key)
              const current = safeDestinations.filter((destination) => destination.channel === integration.key)

              return (
                <div key={integration.key} className="rounded-xl border border-slate-200 bg-white p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                    <div className="flex min-w-0 items-start gap-3 lg:w-64">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 ${toneClasses(integration.tone)}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900">{integration.name}</h3>
                        <p className="mt-0.5 text-[11px] leading-4 text-slate-500">{integration.description}</p>
                        {connected && (
                          <span className="mt-2 inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-100">
                            Connected
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      {integration.key === 'telegram' && (
                        <form action={handleAddTelegram} className="grid gap-2 sm:grid-cols-2">
                          <Input name="bot_token" placeholder="Bot token" required className="h-9 rounded-lg bg-slate-50 text-xs" />
                          <Input name="chat_id" placeholder="Chat or channel ID" required className="h-9 rounded-lg bg-slate-50 text-xs" />
                          <Button type="submit" size="sm" className="h-8 w-fit rounded-lg bg-sky-50 px-3 text-xs font-semibold text-sky-700 ring-1 ring-sky-200 hover:bg-sky-100">
                            Add Telegram
                          </Button>
                        </form>
                      )}

                      {integration.key === 'discord' && (
                        <form action={handleAddDiscord} className="flex flex-col gap-2 sm:flex-row">
                          <Input name="webhook_url" placeholder="https://discord.com/api/webhooks/..." required className="h-9 min-w-0 rounded-lg bg-slate-50 font-mono text-xs" />
                          <Button type="submit" size="sm" className="h-8 rounded-lg bg-violet-50 px-3 text-xs font-semibold text-violet-700 ring-1 ring-violet-200 hover:bg-violet-100">
                            Add Discord
                          </Button>
                        </form>
                      )}

                      {integration.key === 'slack' && (
                        <form action={handleAddSlack} className="flex flex-col gap-2 sm:flex-row">
                          <Input name="webhook_url" placeholder="https://hooks.slack.com/services/..." required className="h-9 min-w-0 rounded-lg bg-slate-50 font-mono text-xs" />
                          <Button type="submit" size="sm" className="h-8 rounded-lg bg-sky-50 px-3 text-xs font-semibold text-sky-700 ring-1 ring-sky-200 hover:bg-sky-100">
                            Add Slack
                          </Button>
                        </form>
                      )}

                      {integration.key === 'email' && (
                        <form action={handleAddEmail} className="grid gap-2 sm:grid-cols-2">
                          <Input name="api_key" type="password" placeholder="Resend API key" required className="h-9 rounded-lg bg-slate-50 font-mono text-xs" />
                          <Input name="to" type="email" placeholder="Recipient email" required className="h-9 rounded-lg bg-slate-50 text-xs" />
                          <Input name="subject" placeholder="Subject (optional)" className="h-9 rounded-lg bg-slate-50 text-xs" />
                          <Button type="submit" size="sm" className="h-8 w-fit rounded-lg bg-sky-50 px-3 text-xs font-semibold text-sky-700 ring-1 ring-sky-200 hover:bg-sky-100">
                            Add email
                          </Button>
                        </form>
                      )}

                      {integration.key === 'webhook' && (
                        <form action={handleAddWebhook} className="grid gap-2 sm:grid-cols-[1fr_180px_auto]">
                          <Input name="endpoint_url" placeholder="https://api.example.com/webhook" required className="h-9 min-w-0 rounded-lg bg-slate-50 font-mono text-xs" />
                          <Input name="secret" placeholder="Signing secret (optional)" className="h-9 rounded-lg bg-slate-50 text-xs" />
                          <Button type="submit" size="sm" className="h-8 rounded-lg bg-violet-50 px-3 text-xs font-semibold text-violet-700 ring-1 ring-violet-200 hover:bg-violet-100">
                            Add HTTP
                          </Button>
                        </form>
                      )}

                      {current.length > 0 && (
                        <div className="mt-3 space-y-1.5">
                          {current.map((destination) => (
                            <div key={destination.id} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 ring-1 ring-slate-100">
                              <span className="truncate font-mono text-[10px] text-slate-500">
                                {destination.channel === 'telegram'
                                  ? `Chat: ${destination.config?.chat_id}`
                                  : destination.channel === 'email'
                                    ? `To: ${destination.config?.to}`
                                    : destination.channel === 'webhook'
                                      ? destination.config?.endpoint_url
                                      : destination.config?.webhook_url}
                              </span>
                              <DeleteDestinationButton
                                destinationId={destination.id}
                                pipelineId={id}
                                destinationName={integration.name}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-4 flex items-start gap-3 rounded-xl border border-dashed border-violet-200 bg-violet-50/40 p-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-violet-600 ring-1 ring-violet-100">
              <ChevronRight className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-800">Built to add more integrations</p>
              <p className="mt-0.5 text-[11px] leading-5 text-slate-500">
                Telegram, Discord, Slack, email and generic HTTP are supported today. New app connectors can be added without changing the workflow model.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
