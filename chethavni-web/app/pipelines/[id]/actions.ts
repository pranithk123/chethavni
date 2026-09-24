'use server'

import { createClient } from '../../../lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { assertCanAddDestination, assertPipelineOwner } from '../../../lib/plan-limits'

async function getAuthorizedClient(pipelineId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  await assertCanAddDestination(supabase, pipelineId, user.id)
  return supabase
}

async function getOwnedClient(pipelineId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  await assertPipelineOwner(supabase, pipelineId, user.id)
  return supabase
}

export async function updateMessageTemplate(pipelineId: string, formData: FormData) {
  const supabase = await getOwnedClient(pipelineId)
  const messageTemplate = formData.get('message_template') as string

  const { error } = await supabase
    .from('pipelines')
    .update({ message_template: messageTemplate })
    .eq('id', pipelineId)

  if (error) throw new Error(error.message)
  revalidatePath(`/pipelines/${pipelineId}`)
}

export async function addDiscordDestination(pipelineId: string, formData: FormData) {
  const supabase = await getAuthorizedClient(pipelineId)
  const webhookUrl = formData.get('webhook_url') as string

  const { error } = await supabase.from('destinations').insert({
    pipeline_id: pipelineId,
    channel: 'discord',
    config: { webhook_url: webhookUrl },
    is_enabled: true,
  })

  if (error) throw new Error(error.message)
  revalidatePath(`/pipelines/${pipelineId}`)
}

export async function addTelegramDestination(pipelineId: string, formData: FormData) {
  const supabase = await getAuthorizedClient(pipelineId)
  const botToken = formData.get('bot_token') as string
  const chatId = formData.get('chat_id') as string

  const { error } = await supabase.from('destinations').insert({
    pipeline_id: pipelineId,
    channel: 'telegram',
    config: { bot_token: botToken, chat_id: chatId },
    is_enabled: true,
  })

  if (error) throw new Error(error.message)
  revalidatePath(`/pipelines/${pipelineId}`)
}

export async function addSlackDestination(pipelineId: string, formData: FormData) {
  const supabase = await getAuthorizedClient(pipelineId)
  const webhookUrl = formData.get('webhook_url') as string

  const { error } = await supabase.from('destinations').insert({
    pipeline_id: pipelineId,
    channel: 'slack',
    config: { webhook_url: webhookUrl },
    is_enabled: true,
  })

  if (error) throw new Error(error.message)
  revalidatePath(`/pipelines/${pipelineId}`)
}

export async function addEmailDestination(pipelineId: string, formData: FormData) {
  const supabase = await getAuthorizedClient(pipelineId)
  const apiKey = formData.get('api_key') as string
  const to = formData.get('to') as string
  const subject = formData.get('subject') as string

  const { error } = await supabase.from('destinations').insert({
    pipeline_id: pipelineId,
    channel: 'email',
    config: { api_key: apiKey, to: to, subject: subject },
    is_enabled: true,
  })

  if (error) throw new Error(error.message)
  revalidatePath(`/pipelines/${pipelineId}`)
}

export async function addCustomWebhookDestination(pipelineId: string, formData: FormData) {
  const supabase = await getAuthorizedClient(pipelineId)
  const endpointUrl = formData.get('endpoint_url') as string
  const secret = formData.get('secret') as string

  const { error } = await supabase.from('destinations').insert({
    pipeline_id: pipelineId,
    channel: 'webhook',
    config: { endpoint_url: endpointUrl, secret: secret },
    is_enabled: true,
  })

  if (error) throw new Error(error.message)
  revalidatePath(`/pipelines/${pipelineId}`)
}

export async function deleteDestination(pipelineId: string, destinationId: string) {
  const supabase = await getOwnedClient(pipelineId)

  const { error } = await supabase
    .from('destinations')
    .delete()
    .eq('id', destinationId)
    .eq('pipeline_id', pipelineId)

  if (error) throw new Error(error.message)
  revalidatePath(`/pipelines/${pipelineId}`)
}