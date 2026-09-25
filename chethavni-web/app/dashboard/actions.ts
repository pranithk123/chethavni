'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '../../lib/supabase/server'

export async function createPipeline(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const name = formData.get('name') as string
  const description = formData.get('description') as string

  const { data: pipelineData, error } = await supabase
    .rpc('create_pipeline_if_allowed', {
      p_name: name,
      p_description: description,
    })
    .single()

  if (error) {
    if (error.message.startsWith('WORKFLOW_LIMIT:')) {
      const [, plan, limit] = error.message.split(':')
      throw new Error(`You've reached the ${plan === 'free' ? 'Free' : plan} plan limit of ${limit} workflows. Upgrade to create more.`)
    }
    throw new Error('Unable to create workflow. Please try again.')
  }

  const data = pipelineData as { id: string }
  revalidatePath('/dashboard')
  return data.id
}
export async function signout() {
  const { createClient } = await import("@/lib/supabase/server");
  const { redirect } = await import("next/navigation");
  const { revalidatePath } = await import("next/cache");
  
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
