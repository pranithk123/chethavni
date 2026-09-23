import { login, signup } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
      <Card className="w-full max-w-md border-zinc-800 bg-zinc-900 text-zinc-100">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight text-center">
            ⚡ Chethavni
          </CardTitle>
          <CardDescription className="text-center text-zinc-400">
            Real-time webhook routing & notification engine
          </CardDescription>
        </CardHeader>
        <CardContent>
          {params.error && (
            <div className="mb-4 rounded-md bg-rose-950/50 p-3 text-sm text-rose-400 border border-rose-900">
              {params.error}
            </div>
          )}

          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="trader@chethavni.com"
                required
                className="border-zinc-700 bg-zinc-800 text-zinc-100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                className="border-zinc-700 bg-zinc-800 text-zinc-100"
              />
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Button formAction={login} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium">
                Log In
              </Button>
              <Button
                formAction={signup}
                variant="outline"
                className="w-full border-zinc-700 bg-transparent text-zinc-200 hover:bg-zinc-800"
              >
                Create Account
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}