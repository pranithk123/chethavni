'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createPipeline } from '@/app/dashboard/actions'
import { useToast } from '@/components/ui/toast'

export function CreatePipelineDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [limitMessage, setLimitMessage] = useState<string | null>(null)
  const router = useRouter()
  const { showToast } = useToast()

  const handleSubmit = async (formData: FormData) => {
    setLoading(true)
    setLimitMessage(null)
    try {
      const pipelineId = await createPipeline(formData)
      setOpen(false)
      router.push(`/pipelines/${pipelineId}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create workflow'
      if (message.includes('plan limit')) {
        setLimitMessage(message)
      } else {
        showToast('error', message)
      }
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => {
      setOpen(nextOpen)
      if (!nextOpen) setLimitMessage(null)
    }}>
      <DialogTrigger asChild>
        <Button className="h-9 rounded-lg bg-sky-600 px-3.5 text-xs font-semibold text-white ring-1 ring-sky-600 hover:bg-sky-700 transition-colors">
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          New workflow
        </Button>
      </DialogTrigger>

      <DialogContent className="border-slate-200 bg-white text-slate-900 shadow-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">Create a workflow</DialogTitle>
          <DialogDescription className="text-xs leading-5 text-slate-500">
            Give your automation a name. You can configure its trigger and integrations on the next screen.
          </DialogDescription>
        </DialogHeader>

        {limitMessage && (
          <div role="alert" className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div className="min-w-0">
              <p className="text-sm font-semibold">Workflow limit reached</p>
              <p className="mt-1 text-xs leading-5 text-amber-800">
                {limitMessage}
              </p>
              <Link
                href="/pricing"
                onClick={() => setOpen(false)}
                className="mt-2 inline-flex text-xs font-semibold text-indigo-700 underline underline-offset-2 hover:text-indigo-900"
              >
                View upgrade options
              </Link>
            </div>
          </div>
        )}

        <form action={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs font-semibold text-slate-700">
              Workflow name <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g. New order notifications"
              required
              disabled={loading}
              className="h-9 rounded-lg border-slate-200 bg-slate-50 text-xs focus-visible:ring-sky-200"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs font-semibold text-slate-700">Description</Label>
            <Input
              id="description"
              name="description"
              placeholder="What should this workflow do?"
              disabled={loading}
              className="h-9 rounded-lg border-slate-200 bg-slate-50 text-xs focus-visible:ring-sky-200"
            />
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="h-9 rounded-lg border-slate-200 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="h-9 rounded-lg bg-sky-600 px-4 text-xs text-white hover:bg-sky-700"
            >
              {loading ? (
                <>
                  <span className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  Creating...
                </>
              ) : (
                'Create workflow'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
