import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { destinationId, pipelineId } = await request.json()

    if (!destinationId || !pipelineId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify the pipeline belongs to the user
    const { data: pipeline } = await supabase
      .from('pipelines')
      .select('id')
      .eq('id', pipelineId)
      .eq('user_id', user.id)
      .single()

    if (!pipeline) {
      return NextResponse.json({ error: 'Pipeline not found' }, { status: 404 })
    }

    // Delete the destination
    const { error } = await supabase
      .from('destinations')
      .delete()
      .eq('id', destinationId)
      .eq('pipeline_id', pipelineId)

    if (error) {
      throw error
    }

    revalidatePath(`/pipelines/${pipelineId}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete destination error:', error)
    return NextResponse.json(
      { error: 'Failed to delete destination' },
      { status: 500 }
    )
  }
}
