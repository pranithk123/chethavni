import { login, signup } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowRight, GitBranch, LockKeyhole, Sparkles } from 'lucide-react'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#fff8dc] p-4 text-slate-900">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-cyan-300/70 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-fuchsia-300/50 blur-3xl" />
      <Card className="relative w-full max-w-md border-amber-200 bg-white/95 shadow-[0_24px_70px_rgba(93,65,20,0.14)]">
        <CardHeader className="space-y-4 pb-5">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-[0_10px_24px_rgba(79,70,229,0.3)]">
            <GitBranch className="h-7 w-7" />
          </div>
          <CardTitle className="text-center text-2xl font-bold tracking-tight text-indigo-950">
            Chethavni
          </CardTitle>
          <CardDescription className="text-center text-slate-500">
            Route every signal to the right place.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {params.error && (
            <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {params.error}
            </div>
          )}

          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-semibold text-indigo-950">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="trader@chethavni.com"
                required
                className="h-10 border-amber-200 bg-amber-50/50 text-slate-900 placeholder:text-slate-400 focus-visible:border-indigo-400 focus-visible:ring-indigo-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-semibold text-indigo-950">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                className="h-10 border-amber-200 bg-amber-50/50 text-slate-900 placeholder:text-slate-400 focus-visible:border-indigo-400 focus-visible:ring-indigo-200"
              />
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Button formAction={login} className="h-10 w-full bg-indigo-600 font-semibold text-white shadow-[0_8px_18px_rgba(79,70,229,0.24)] hover:bg-indigo-700">
                <LockKeyhole className="h-4 w-4" />
                Log in
              </Button>
              <Button
                formAction={signup}
                variant="outline"
                className="h-10 w-full border-cyan-200 bg-cyan-50 text-cyan-800 hover:bg-cyan-100"
              >
                <Sparkles className="h-4 w-4" />
                Create account
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}