import { Navigate } from 'react-router-dom'
import { Building2, ShieldCheck } from 'lucide-react'
import { useAuthStore } from '@/hooks/useAuth'
import { SetPasswordForm } from '@/features/auth/components/SetPasswordForm'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default function SetPasswordPage() {
  const employee = useAuthStore((s) => s.employee)
  const user = useAuthStore((s) => s.user)
  const isLoading = useAuthStore((s) => s.isLoading)

  // Show loading state while checking session
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  // Not authenticated — redirect to login
  if (!user) return <Navigate to="/login" replace />

  // Already set password — redirect to dashboard
  if (employee && !employee.is_first_login) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Decorative background elements */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-indigo-200/30 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-sm px-4">
        <Card className="border-0 bg-white/80 shadow-xl backdrop-blur-md">
          <CardHeader className="space-y-3 pb-2 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
              <ShieldCheck className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight" id="set-password-title">
                Set your password
              </h1>
              <p className="text-sm text-muted-foreground">
                {employee
                  ? `Welcome, ${employee.first_name}! Please choose a secure password.`
                  : 'Choose a secure password for your account.'}
              </p>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <SetPasswordForm />
          </CardContent>
        </Card>
        <p className="mt-6 text-center text-xs text-muted-foreground/60">
          <Building2 className="mr-1 inline h-3 w-3" />
          HR Tool &mdash; First-time setup
        </p>
      </div>
    </div>
  )
}
