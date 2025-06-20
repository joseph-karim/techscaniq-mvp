import React from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Report component error:', error, errorInfo)
    // Could send to error reporting service like Sentry
  }

  resetError = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return <FallbackComponent error={this.state.error!} resetError={this.resetError} />
      }

      return (
        <Alert variant="destructive" className="m-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription className="mt-2">
            <div className="space-y-2">
              <p>There was an error loading this report component.</p>
              {this.state.error && (
                <details className="text-sm">
                  <summary className="cursor-pointer font-medium">Error details</summary>
                  <pre className="mt-2 whitespace-pre-wrap text-xs bg-destructive/10 p-2 rounded">
                    {this.state.error.message}
                  </pre>
                </details>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={this.resetError}
                className="mt-2"
              >
                Try again
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )
    }

    return this.props.children
  }
}