'use client'

import { MessageSquare } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'

export function NoDestinationsState() {
  return (
    <div className="mt-4">
      <EmptyState
        icon={MessageSquare}
        title="No destinations yet"
        description="Connect apps to receive alerts when this workflow runs. Add your first integration above to get started."
        variant="subtle"
      />
    </div>
  )
}
