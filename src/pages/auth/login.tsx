import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle } from 'lucide-react'
import { useAuth } from '@/lib/auth/auth-provider'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { TechScanButton } from '@/components/brand'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'

const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'investor@example.com', // Pre-filled for demo purposes
      password: 'password123',       // Pre-filled for demo purposes
    },
  })

  async function onSubmit(data: LoginForm) {
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await signIn(data.email, data.password)
      
      if (error) {
        setError(error.message || 'Failed to sign in')
        return
      }
      
      navigate('/')
    } catch (err) {
      setError('An unexpected error occurred')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleQuickLogin(role: 'investor' | 'admin' | 'pe') {
    setIsLoading(true)
    setError(null)

    try {
      const roleEmails = {
        investor: 'investor@example.com',
        admin: 'admin@example.com',
        pe: 'pe@example.com'
      }
      
      const { error } = await signIn(roleEmails[role], 'password123')
      
      if (error) {
        setError(error.message || 'Failed to sign in')
        return
      }
      
      navigate('/')
    } catch (err) {
      setError('An unexpected error occurred')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center space-y-2 text-center">
          <img src="/Tesch_Scan_IQ_Logo_Transparent.png" alt="TechScan IQ" className="h-12 w-auto mb-4" />
          <p className="text-muted-foreground font-ibm">
            AI-Powered Technical Due Diligence for Early-Stage Investors
          </p>
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="space-y-4">
            <div className="text-center">
              <h2 className="text-xl font-semibold font-space">Sign In</h2>
              <p className="text-sm text-muted-foreground font-ibm">
                Enter your credentials to access your account
              </p>
              <div className="mt-2 rounded-md bg-caution-amber/10 p-2 text-xs text-caution-amber font-ibm">
                <p><strong className="font-space">Demo Mode:</strong> Use quick login buttons below or any email/password.</p>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-space">Email</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="you@example.com"
                          type="email"
                          autoComplete="email"
                          disabled={isLoading}
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
                        <FormLabel className="font-space">Password</FormLabel>
                        <Link
                          to="/forgot-password"
                          className="text-xs text-primary hover:underline font-ibm"
                        >
                          Forgot password?
                        </Link>
                      </div>
                      <FormControl>
                        <Input
                          placeholder="******"
                          type="password"
                          autoComplete="current-password"
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <TechScanButton type="submit" className="w-full" disabled={isLoading} loading={isLoading}>
                  Sign In
                </TechScanButton>
              </form>
            </Form>

            <div className="mt-4 space-y-2">
              <div className="text-center text-xs text-muted-foreground font-ibm">Quick Demo Login</div>
              <div className="grid grid-cols-3 gap-2">
                <TechScanButton
                  variant="secondary"
                  size="sm"
                  className="text-xs"
                  onClick={() => handleQuickLogin('investor')}
                  disabled={isLoading}
                >
                  Investor
                </TechScanButton>
                <TechScanButton
                  variant="secondary"
                  size="sm"
                  className="text-xs"
                  onClick={() => handleQuickLogin('admin')}
                  disabled={isLoading}
                >
                  Admin
                </TechScanButton>
                <TechScanButton
                  variant="secondary"
                  size="sm"
                  className="text-xs"
                  onClick={() => handleQuickLogin('pe')}
                  disabled={isLoading}
                >
                  PE
                </TechScanButton>
              </div>
            </div>

            <div className="mt-4 text-center text-sm font-ibm">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary hover:underline">
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}