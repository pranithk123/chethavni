'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
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
  const { showToast } = useToast()

  const handleSubmit = async (formData: FormData) => {
    setLoading(true)
    try {
      await createPipeline(formData)
      showToast('success', 'Workflow created successfully')
      setOpen(false)
    } catch (error) {
      showToast('error', 'Failed to create workflow')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
