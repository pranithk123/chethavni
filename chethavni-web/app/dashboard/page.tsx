import { createClient } from '../../lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { signout } from '../login/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CreatePipelineDialog } from '@/components/CreatePipelineDialog'

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
    .single()

  const { data: pipelines } = await supabase
    .from('pipelines')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">⚡ Chethavni Dashboard</h1>
            <p className="text-sm text-zinc-400">
              Logged in as <span className="text-zinc-200">{user.email}</span>
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="bg-emerald-950 text-emerald-400 border-emerald-800">
              Tier: {profile?.tier?.toUpperCase() || 'FREE'}
            </Badge>
            <form action={signout}>
              <Button variant="outline" size="sm" className="border-zinc-700 hover:bg-zinc-800">
                Log Out
              </Button>
            </form>
          </div>
        </div>

        {/* Pipelines Header & Dialog Trigger */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Active Pipelines</h2>
            <p className="text-sm text-zinc-400">Manage your webhook endpoints and alerts</p>
          </div>
          <CreatePipelineDialog />
        </div>

        {/* Pipelines Grid */}
        {pipelines && pipelines.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pipelines.map((p) => (
              <Link key={p.id} href={`/pipelines/${p.id}`}>
                <Card className="border-zinc-800 bg-zinc-900/80 hover:bg-zinc-900 transition-colors cursor-pointer text-zinc-100 h-full flex flex-col justify-between">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg text-emerald-400">{p.name}</CardTitle>
                      <Badge variant="outline" className={p.is_active ? 'border-emerald-700 text-emerald-400' : 'border-zinc-700 text-zinc-500'}>
                        {p.is_active ? 'Active' : 'Paused'}
                      </Badge>
                    </div>
                    {p.description && (
                      <CardDescription className="text-zinc-400">{p.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="rounded bg-zinc-950 p-2 text-xs font-mono text-zinc-400 break-all border border-zinc-800">
                      Token: {p.pipeline_token}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-zinc-800 p-12 text-center text-zinc-500">
            No pipelines created yet. Click "+ New Pipeline" above to create your first one.
          </div>
        )}
      </div>
    </div>
  )
}