import { useState } from 'react'
import { Link } from 'react-router-dom'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { useAuth } from '@/lib/auth/auth-provider'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
})

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const form = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: 'investor@example.com',
    },
  })

  async function onSubmit(data: ForgotPasswordForm) {
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await resetPassword(data.email)
      
      if (error) {
        setError(error.message || 'Failed to send reset email')
        return
      }
      
      setEmailSent(true)
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
          <img src="/favicon.svg" alt="TechScan IQ" className="h-12 w-12" />
          <h1 className="text-3xl font-bold">Reset Password</h1>
          <p className="text-muted-foreground">
            Enter your email address and we'll send you a link to reset your password
          </p>
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {emailSent ? (
            <div className="space-y-4">
              <Alert className="border-green-200 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-300">
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  If an account exists with {form.getValues('email')}, you will receive a password reset link shortly.
                </AlertDescription>
              </Alert>

              <div className="mt-2 rounded-md bg-yellow-50 p-2 text-xs text-yellow-800">
                <p><strong>Demo Mode:</strong> No email will be sent. This is just a simulation.</p>
              </div>

              <Button variant="outline" className="w-full" asChild>
                <Link to="/login">Back to Login</Link>
              </Button>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
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

                <div className="mb-4 rounded-md bg-yellow-50 p-2 text-xs text-yellow-800">
                  <p><strong>Demo Mode:</strong> Enter any valid email address and click "Send Reset Link".</p>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
                </Button>

                <div className="text-center text-sm">
                  <Link to="/login" className="text-primary hover:underline">
                    Back to Login
                  </Link>
                </div>
              </form>
            </Form>
          )}
        </div>
      </div>
    </div>
  )
}