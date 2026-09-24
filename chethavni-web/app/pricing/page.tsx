import Link from 'next/link'
import { ArrowLeft, Check, MessageCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { planLabel, PLAN_LIMITS, type PlanTier } from '@/lib/plan-limits'

function whatsappUrl(plan: Exclude<PlanTier, 'free'>, email?: string) {
  const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/[^0-9]/g, '')
  if (!number) return '#'
  const price = PLAN_LIMITS[plan].price
  const accountEmail = email || '[your Chethavni account email]'
  const message = `Hi, I want to activate the Chethavni ${planLabel(plan)} plan for ₹${price}/month.\n\nMy Chethavni account email is: ${accountEmail}\n\nPlease let me know the payment details.`
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`
}

export default async function PricingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const plans: Array<{ key: PlanTier; description: string; features: string[] }> = [
    {
      key: 'free',
      description: 'A simple starting point for lightweight automations.',
      features: ['100 executions per day', '2 workflows', '2 destinations per workflow', 'Basic workflow automation'],
    },
    {
      key: 'starter',
      description: 'More room for everyday webhook workflows.',
      features: ['5,000 executions per month', '10 workflows', '5 destinations per workflow', 'All supported integrations', 'Execution history'],
    },
    {
      key: 'pro',
      description: 'Higher limits for serious workflow volume.',
      features: ['25,000 executions per month', '50 workflows', '10 destinations per workflow', 'All supported integrations', 'Execution history'],
    },
  ]

  return (
    <main className="min-h-screen bg-white px-5 py-8 text-slate-800 sm:px-7 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <Link href={user ? '/dashboard' : '/login'} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition hover:text-indigo-700">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <div className="mt-10 max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-indigo-600">Plans</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-indigo-950">Choose the right amount of room.</h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">Payments are currently handled manually. After payment, your plan will be activated by the Chethavni team.</p>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {plans.map((plan) => {
            const paid = plan.key !== 'free'
            return (
              <section key={plan.key} className={`rounded-2xl border bg-white p-6 shadow-[0_10px_30px_rgba(30,41,59,0.06)] ${plan.key === 'pro' ? 'border-indigo-300' : 'border-slate-200'}`}>
                {plan.key === 'pro' && <span className="inline-flex rounded-full bg-indigo-100 px-2 py-1 text-[10px] font-semibold text-indigo-700">Higher limits</span>}
                <h2 className="mt-3 text-lg font-bold text-indigo-950">{planLabel(plan.key)}</h2>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-slate-950">₹{PLAN_LIMITS[plan.key].price}</span>
                  <span className="text-xs text-slate-500">/{paid ? 'month' : 'always'}</span>
                </div>
                <p className="mt-3 min-h-10 text-sm leading-5 text-slate-500">{plan.description}</p>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature) => <li key={feature} className="flex items-start gap-2 text-xs text-slate-600"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-600" />{feature}</li>)}
                </ul>
                {paid ? (
                  <a href={whatsappUrl(plan.key === 'starter' ? 'starter' : 'pro', user?.email || undefined)} target="_blank" rel="noreferrer" className="mt-7 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 text-xs font-semibold text-white transition hover:bg-indigo-700">
                    <MessageCircle className="h-4 w-4" />
                    Get {planLabel(plan.key)} on WhatsApp
                  </a>
                ) : (
                  <Link href={user ? '/dashboard' : '/login'} className="mt-7 inline-flex h-10 w-full items-center justify-center rounded-lg border border-cyan-200 bg-cyan-50 px-4 text-xs font-semibold text-cyan-800 transition hover:bg-cyan-100">Start free</Link>
                )}
              </section>
            )
          })}
        </div>

        <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-900">
          <strong>How manual activation works:</strong> choose a plan, contact us on WhatsApp, complete payment, send your Chethavni account email, and the team activates your plan manually.
        </div>
      </div>
    </main>
  )
}