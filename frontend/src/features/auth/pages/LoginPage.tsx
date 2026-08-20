import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Navigate, useLocation, type Location } from 'react-router-dom'
import { CalendarClock, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import axios from 'axios'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useCurrentUser, useForgotPassword, useLogin } from '@/features/auth/queries'
import type { ApiErrorBody } from '@/lib/api-client'

const loginSchema = z.object({
  email: z.email('Enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
  remember: z.boolean().optional(),
})

const forgotPasswordSchema = z.object({
  email: z.email('Enter a valid email address.'),
})

type LoginValues = z.infer<typeof loginSchema>
type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>

export function LoginPage() {
  const { data: user, isPending: isSessionPending } = useCurrentUser()
  const location = useLocation()
  const [mode, setMode] = useState<'login' | 'forgot-password'>('login')

  if (!isSessionPending && user) {
    const from = (location.state as { from?: Location })?.from?.pathname ?? '/agenda'
    return <Navigate to={from} replace />
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-secondary/60 to-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <CalendarClock className="size-5" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Agenda</h1>
          <p className="text-sm text-muted-foreground">Panel de gestión de turnos</p>
        </div>

        <Card className="shadow-md">
          {mode === 'login' ? (
            <LoginForm onForgotPassword={() => setMode('forgot-password')} />
          ) : (
            <ForgotPasswordForm onBack={() => setMode('login')} />
          )}
        </Card>
      </div>
    </div>
  )
}

function LoginForm({ onForgotPassword }: { onForgotPassword: () => void }) {
  const login = useLogin()

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', remember: false },
  })

  const onSubmit = form.handleSubmit((values) => {
    login.mutate(values, {
      onError: (error) => applyServerErrors(error, form),
    })
  })

  return (
    <>
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>Use your staff account to access the dashboard.</CardDescription>
      </CardHeader>
      <CardContent>
        {login.isError && !hasFieldErrors(login.error) && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{extractMessage(login.error)}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      autoComplete="email"
                      placeholder="you@omluruguay.com"
                      autoFocus
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Password</FormLabel>
                    <button
                      type="button"
                      onClick={onForgotPassword}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <FormControl>
                    <Input type="password" autoComplete="current-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="remember"
              render={({ field }) => (
                <label className="flex items-center gap-2 text-sm text-muted-foreground select-none">
                  <input
                    type="checkbox"
                    checked={field.value ?? false}
                    onChange={(event) => field.onChange(event.target.checked)}
                    className="size-4 rounded border-input text-primary accent-primary"
                  />
                  Remember me
                </label>
              )}
            />

            <Button type="submit" className="w-full" disabled={login.isPending}>
              {login.isPending && <Loader2 className="animate-spin" />}
              Sign in
            </Button>
          </form>
        </Form>
      </CardContent>
    </>
  )
}

function ForgotPasswordForm({ onBack }: { onBack: () => void }) {
  const forgotPassword = useForgotPassword()

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  const onSubmit = form.handleSubmit((values) => {
    forgotPassword.mutate(values, {
      onSuccess: (message) => {
        toast.success(message)
      },
      onError: (error) => applyServerErrors(error, form),
    })
  })

  return (
    <>
      <CardHeader>
        <CardTitle>Reset your password</CardTitle>
        <CardDescription>
          We&apos;ll email you a link to reset your password if the address matches an account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {forgotPassword.isError && !hasFieldErrors(forgotPassword.error) && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{extractMessage(forgotPassword.error)}</AlertDescription>
          </Alert>
        )}
        {forgotPassword.isSuccess && (
          <Alert variant="success" className="mb-4">
            <AlertDescription>{forgotPassword.data}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      autoComplete="email"
                      placeholder="you@omluruguay.com"
                      autoFocus
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col gap-2">
              <Button type="submit" className="w-full" disabled={forgotPassword.isPending}>
                {forgotPassword.isPending && <Loader2 className="animate-spin" />}
                Send reset link
              </Button>
              <Button type="button" variant="ghost" className="w-full" onClick={onBack}>
                Back to sign in
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </>
  )
}

/** Maps Laravel's 422 `{errors: {field: [...]}}` onto matching form fields. */
function applyServerErrors<TValues extends Record<string, unknown>>(
  error: unknown,
  form: ReturnType<typeof useForm<TValues>>,
) {
  if (axios.isAxiosError<ApiErrorBody>(error) && error.response?.status === 422) {
    const errors = error.response.data.errors ?? {}
    for (const [field, messages] of Object.entries(errors)) {
      form.setError(field as never, { type: 'server', message: messages[0] })
    }
  }
}

function hasFieldErrors(error: unknown): boolean {
  return axios.isAxiosError<ApiErrorBody>(error) && error.response?.status === 422
}

function extractMessage(error: unknown): string {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    return error.response?.data?.message ?? 'Something went wrong. Please try again.'
  }
  return 'Something went wrong. Please try again.'
}
