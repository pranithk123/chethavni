'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useToast } from '@/components/ui/toast'

interface DeletePipelineButtonProps {
  pipelineId: string
  pipelineName: string
}

export function DeletePipelineButton({ pipelineId, pipelineName }: DeletePipelineButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false)
  const router = useRouter()
  const { showToast } = useToast()

  const handleDelete = async () => {
    try {
      const response = await fetch('/api/pipelines/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pipelineId }),
      })

      if (!response.ok) throw new Error('Failed to delete workflow')

      showToast('success', 'Workflow deleted successfully')
      router.push('/dashboard')
    } catch {
      showToast('error', 'Failed to delete workflow')
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setShowConfirm(true)}
        className="h-9 gap-1.5 rounded-lg border-rose-200 bg-white px-3 text-xs font-semibold text-rose-700 hover:bg-rose-50"
      >
        <Trash2 className="h-3.5 w-3.5" />
        Delete workflow
      </Button>

      <ConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title="Delete workflow?"
        description={`This permanently deletes ${pipelineName}, its trigger URL, and all connected destinations. This cannot be undone.`}
        confirmLabel="Delete workflow"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </>
  )
}
