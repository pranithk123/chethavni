import { createClient } from '../../../lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  addDiscordDestination, 
  addTelegramDestination, 
  addSlackDestination,
  addEmailDestination,
  addCustomWebhookDestination,
  updateMessageTemplate, 
  deleteDestination 
} from './actions'

export default async function PipelineDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
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

  const { data: destinations } = await supabase
    .from('destinations')
    .select('*')
    .eq('pipeline_id', id)

  const { data: logs } = await supabase
    .from('execution_logs')
    .select('*')
    .eq('pipeline_id', id)
    .order('created_at', { ascending: false })
    .limit(5)

  const webhookUrl = `http://localhost:8080/v1/hook/${pipeline.pipeline_token}`

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Navigation */}
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <Link href="/dashboard" className="hover:text-zinc-200">
            ← Back to Dashboard
          </Link>
        </div>

        {/* Pipeline Heading */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div>
            <h1 className="text-2xl font-bold">{pipeline.name}</h1>
            <p className="text-sm text-zinc-400">{pipeline.description || 'Universal Webhook Alert Hub'}</p>
          </div>
          <Badge className="bg-emerald-950 text-emerald-400 border-emerald-800">
            {pipeline.is_active ? 'Active' : 'Inactive'}
          </Badge>
        </div>

        {/* Webhook Endpoint Card */}
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-lg text-emerald-400">Inbound Webhook Endpoint</CardTitle>
            <CardDescription className="text-zinc-400">
              Paste this URL into Chartink, TradingView, Stripe, Shopify, Razorpay, or GitHub.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <input
              readOnly
              value={webhookUrl}
              className="w-full font-mono text-sm bg-zinc-950 border border-zinc-800 rounded p-2.5 text-zinc-200"
            />
          </CardContent>
        </Card>

        {/* Message Template Customizer */}
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-lg">Alert Message Template</CardTitle>
            <CardDescription className="text-zinc-400">
              Format alert body. Use <code className="text-emerald-400 font-mono">{'{{payload}}'}</code> or specific payload keys.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={updateMessageTemplate.bind(null, pipeline.id)} className="space-y-3">
              <textarea
                name="message_template"
                defaultValue={pipeline.message_template || '🚨 Alert for {{ticker}}: Price {{price}} | Signal: {{signal}}'}
                rows={3}
                className="w-full font-mono text-sm bg-zinc-950 border border-zinc-800 rounded p-3 text-zinc-200 focus:outline-none focus:border-emerald-500"
              />
              <div className="flex justify-end">
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs">
                  Save Template
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Configured Destinations Manager */}
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-lg">Connected Channels & Fanout Destinations</CardTitle>
            <CardDescription className="text-zinc-400">
              One incoming webhook fans out simultaneously to all connected channels.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {destinations && destinations.length > 0 ? (
              <div className="space-y-2">
                {destinations.map((d) => (
                  <div key={d.id} className="p-3 bg-zinc-950 rounded border border-zinc-800 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold uppercase text-xs px-2 py-1 rounded bg-zinc-900 border border-zinc-700 text-indigo-400">
                        {d.channel}
                      </span>
                      <span className="text-xs text-zinc-500 font-mono truncate max-w-sm">
                        {d.channel === 'discord' || d.channel === 'slack' ? d.config?.webhook_url : ''}
                        {d.channel === 'telegram' ? `Chat ID: ${d.config?.chat_id}` : ''}
                        {d.channel === 'email' ? `To: ${d.config?.to}` : ''}
                        {d.channel === 'webhook' ? `Target: ${d.config?.endpoint_url}` : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-emerald-800 text-emerald-400 text-xs">
                        Active
                      </Badge>
                      <form action={deleteDestination.bind(null, pipeline.id, d.id)}>
                        <button
                          type="submit"
                          className="text-xs text-zinc-500 hover:text-rose-400 px-2 py-1 transition-colors"
                        >
                          Remove
                        </button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-sm text-zinc-500 border border-dashed border-zinc-800 rounded">
                No notification channels connected yet. Attach channels below.
              </div>
            )}

            {/* Channels Grid Form */}
            <div className="pt-4 border-t border-zinc-800 grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Slack */}
              <form action={addSlackDestination.bind(null, pipeline.id)} className="space-y-2 p-3 bg-zinc-950 rounded border border-zinc-800">
                <Label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Add Slack Channel</Label>
                <Input
                  name="webhook_url"
                  placeholder="https://hooks.slack.com/services/..."
                  required
                  className="border-zinc-800 bg-zinc-900 text-xs font-mono"
                />
                <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-500 text-xs text-white">
                  Connect Slack
                </Button>
              </form>

              {/* Email (Resend) */}
              <form action={addEmailDestination.bind(null, pipeline.id)} className="space-y-2 p-3 bg-zinc-950 rounded border border-zinc-800">
                <Label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Add Email Alert (Resend)</Label>
                <div className="space-y-1">
                  <Input
                    name="api_key"
                    placeholder="Resend API Key (re_...)"
                    required
                    className="border-zinc-800 bg-zinc-900 text-xs font-mono"
                  />
                  <Input
                    name="to"
                    placeholder="Recipient Email (ops@company.com)"
                    required
                    className="border-zinc-800 bg-zinc-900 text-xs font-mono"
                  />
                  <Input
                    name="subject"
                    placeholder="Subject (Optional)"
                    className="border-zinc-800 bg-zinc-900 text-xs font-mono"
                  />
                </div>
                <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-500 text-xs text-white">
                  Connect Email
                </Button>
              </form>

              {/* Generic Custom Webhook Fanout */}
              <form action={addCustomWebhookDestination.bind(null, pipeline.id)} className="space-y-2 p-3 bg-zinc-950 rounded border border-zinc-800 md:col-span-2">
                <Label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Custom Webhook Forwarder (Fanout)</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Input
                    name="endpoint_url"
                    placeholder="https://api.yourdomain.com/v1/webhook"
                    required
                    className="border-zinc-800 bg-zinc-900 text-xs font-mono"
                  />
                  <Input
                    name="secret"
                    placeholder="HMAC Signing Secret (Optional)"
                    className="border-zinc-800 bg-zinc-900 text-xs font-mono"
                  />
                </div>
                <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-xs text-white">
                  Add Webhook Fanout Endpoint
                </Button>
              </form>

            </div>
          </CardContent>
        </Card>

        {/* Live Execution Logs */}
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader>
            <CardTitle className="text-lg">Recent Deliveries</CardTitle>
            <CardDescription className="text-zinc-400">
              Real-time logs captured and routed by Chethavni.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {logs && logs.length > 0 ? (
              <div className="space-y-3">
                {logs.map((l) => (
                  <div key={l.id} className="p-3 bg-zinc-950 rounded border border-zinc-800 text-xs font-mono space-y-1">
                    <div className="flex justify-between items-center">
                      <Badge className={l.status === 'success' ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'}>
                        {l.status}
                      </Badge>
                      <span className="text-zinc-500">{new Date(l.created_at).toLocaleTimeString()} ({l.execution_duration_ms}ms)</span>
                    </div>
                    <pre className="text-zinc-400 overflow-x-auto p-2 bg-zinc-900 rounded mt-2">
                      {JSON.stringify(l.raw_payload, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-sm text-zinc-500 border border-dashed border-zinc-800 rounded">
                No webhooks received yet. Send a test POST request to test the pipeline!
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}