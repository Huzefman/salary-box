import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { getErrorMessage } from '@/features/auth/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

const forgotPasswordSchema = z.object({
  email: z.string().email('Enter a valid email'),
})
type ForgotPasswordFormType = z.infer<typeof forgotPasswordSchema>

export function ForgotPasswordForm() {
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const form = useForm<ForgotPasswordFormType>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  const isSubmitting = form.formState.isSubmitting

  async function onSubmit(values: ForgotPasswordFormType) {
    setError(null)
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: `${window.location.origin}/set-password`,
      })

      if (resetError) {
        setError(getErrorMessage(resetError))
        return
      }

      // Always show success even if email doesn't exist (security best practice)
      setSent(true)
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  if (sent) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-6 w-6 text-green-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Check your email</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            If an account exists for that email, we&apos;ve sent a password reset link.
          </p>
        </div>
        <Link to="/login">
          <Button variant="outline" className="w-full mt-2" id="forgot-password-back-to-login">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to sign in
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" id="forgot-password-form">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email address</FormLabel>
              <FormControl>
                <Input
                  id="forgot-password-email"
                  type="email"
                  placeholder="you@company.com"
                  autoComplete="email"
                  autoFocus
                  disabled={isSubmitting}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {error && (
          <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" id="forgot-password-error">
            {error}
          </div>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting} id="forgot-password-submit">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending reset link…
            </>
          ) : (
            'Send reset link'
          )}
        </Button>

        <div className="text-center">
          <Link
            to="/login"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="mr-1 inline h-3 w-3" />
            Back to sign in
          </Link>
        </div>
      </form>
    </Form>
  )
}
