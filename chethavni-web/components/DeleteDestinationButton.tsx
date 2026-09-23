'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useToast } from '@/components/ui/toast'

interface DeleteDestinationButtonProps {
  destinationId: string
  pipelineId: string
  destinationName: string
}

export function DeleteDestinationButton({
  destinationId,
  pipelineId,
  destinationName
}: DeleteDestinationButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false)
  const { showToast } = useToast()

  const handleDelete = async () => {
    try {
      const response = await fetch('/api/destinations/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destinationId, pipelineId }),
      })

      if (!response.ok) throw new Error('Failed to delete')

      showToast('success', 'Destination removed successfully')
      window.location.reload()
    } catch (error) {
      showToast('error', 'Failed to remove destination')
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setShowConfirm(true)}
        className="h-7 w-7 shrink-0 rounded-md p-0 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>

      <ConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title="Remove destination?"
        description={`This will permanently remove the ${destinationName} integration. You can add it again later.`}
        confirmLabel="Remove destination"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </>
  )
}
