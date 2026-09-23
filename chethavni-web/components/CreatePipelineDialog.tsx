'use client'

import { useState } from 'react'
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

export function CreatePipelineDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (formData: FormData) => {
    setLoading(true)
    try {
      await createPipeline(formData)
      setOpen(false)
    } catch (err) {
      console.error(err)
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold shadow-sm">
          + Create Alert
        </Button>
      </DialogTrigger>
      <DialogContent className="border-zinc-800 bg-zinc-900 text-zinc-100 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Ingestion Pipeline</DialogTitle>
          <DialogDescription className="text-zinc-400">
            Set up an endpoint to receive incoming webhooks from TradingView, Stripe, or custom scripts.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="name">Pipeline Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g. TradingView NIFTY Breakout"
              required
              className="border-zinc-700 bg-zinc-800 text-zinc-100"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Input
              id="description"
              name="description"
              placeholder="Sends instant Telegram alert on 15m breakout"
              className="border-zinc-700 bg-zinc-800 text-zinc-100"
            />
          </div>
          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
            >
              {loading ? 'Creating...' : 'Create Pipeline'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}