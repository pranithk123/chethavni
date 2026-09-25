import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const pipelineId = typeof body?.pipelineId === 'string' ? body.pipelineId : ''
  if (!pipelineId) return NextResponse.json({ error: 'Missing workflow ID' }, { status: 400 })

  const { data: pipeline } = await supabase
    .from('pipelines')
    .select('id')
    .eq('id', pipelineId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!pipeline) return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })

  const { error: destinationsError } = await supabase
    .from('destinations')
    .delete()
    .eq('pipeline_id', pipelineId)

  if (destinationsError) return NextResponse.json({ error: destinationsError.message }, { status: 500 })

  const { error: pipelineError } = await supabase
    .from('pipelines')
    .delete()
    .eq('id', pipelineId)
    .eq('user_id', user.id)

  if (pipelineError) return NextResponse.json({ error: pipelineError.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
