import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2, XCircle, Clock } from 'lucide-react'

interface TestResult {
  name: string
  status: 'pending' | 'success' | 'error'
  message: string
}

export default function CSPTestPage() {
  const [results, setResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const runTests = async () => {
    setIsRunning(true)
    setResults([])

    const tests = [
      { name: 'External Script Loading', test: () => testExternalScript() },
      { name: 'Inline Script Execution', test: () => testInlineScript() },
      { name: 'External Font Loading', test: () => testExternalFont() },
      { name: 'Image Loading', test: () => testImageLoading() },
      { name: 'External CSS Loading', test: () => testExternalCSS() },
      { name: 'WebSocket Connection', test: () => testWebSocket() },
      { name: 'Fetch API', test: () => testFetchAPI() }
    ]

    for (const test of tests) {
      try {
        const result = await test.test()
        setResults(prev => [...prev, {
          name: test.name,
          status: 'success',
          message: result || 'Test passed'
        }])
      } catch (error: unknown) {
        setResults(prev => [...prev, {
          name: test.name,
          status: 'error',
          message: error instanceof Error ? error.message : 'Unknown error'
        }])
      }
    }

    setIsRunning(false)
  }

  // Test functions
  const testExternalScript = (): Promise<string> => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js'
      script.onload = () => resolve('External script loaded successfully')
      script.onerror = () => reject(new Error('External script blocked by CSP'))
      document.head.appendChild(script)
    })
  }

  const testInlineScript = (): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        eval('console.log("Inline script test")')
        resolve('Inline script executed (CSP may be too permissive)')
      } catch (error: unknown) {
        reject(new Error('Inline script blocked by CSP (good!)'))
      }
    })
  }

  const testExternalFont = (): Promise<string> => {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap'
      link.onload = () => resolve('External font loaded successfully')
      link.onerror = () => reject(new Error('External font blocked by CSP'))
      document.head.appendChild(link)
    })
  }

  const testImageLoading = (): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve('External image loaded successfully')
      img.onerror = () => reject(new Error('External image blocked by CSP'))
      img.src = 'https://via.placeholder.com/100x100.png'
    })
  }

  const testExternalCSS = (): Promise<string> => {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css'
      link.onload = () => resolve('External CSS loaded successfully')
      link.onerror = () => reject(new Error('External CSS blocked by CSP'))
      document.head.appendChild(link)
    })
  }

  const testWebSocket = (): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        const ws = new WebSocket('wss://echo.websocket.org')
        ws.onopen = () => {
          ws.close()
          resolve('WebSocket connection allowed')
        }
        ws.onerror = () => reject(new Error('WebSocket connection blocked by CSP'))
      } catch (error: unknown) {
        reject(new Error('WebSocket blocked by CSP'))
      }
    })
  }

  const testFetchAPI = async (): Promise<string> => {
    try {
      const response = await fetch('https://api.github.com/zen')
      if (response.ok) {
        return 'Fetch API allowed for external domains'
      }
      throw new Error('Fetch request failed')
    } catch (error: unknown) {
      throw new Error('Fetch API blocked by CSP')
    }
  }

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Content Security Policy Test</h1>
        <p className="text-muted-foreground">
          This page tests various CSP directives to ensure security policies are working correctly.
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>CSP Test Suite</CardTitle>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={runTests} 
            disabled={isRunning}
            className="mb-4"
          >
            {isRunning ? 'Running Tests...' : 'Run CSP Tests'}
          </Button>

          {results.length > 0 && (
            <div className="space-y-3">
              {results.map((result, index) => (
                <Alert key={index} className={
                  result.status === 'success' 
                    ? 'border-green-200 bg-green-50' 
                    : 'border-red-200 bg-red-50'
                }>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(result.status)}
                    <AlertDescription>
                      <strong>{result.name}:</strong> {result.message}
                    </AlertDescription>
                  </div>
                </Alert>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Expected Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>✅ <strong>External fonts should load</strong> (from fonts.googleapis.com)</p>
            <p>✅ <strong>External images should load</strong> (from approved domains)</p>
            <p>❌ <strong>Inline scripts should be blocked</strong> (for security)</p>
            <p>✅ <strong>Fetch API should work</strong> (for approved domains)</p>
            <p>✅ <strong>External scripts should load</strong> (from approved CDNs)</p>
            <p>✅ <strong>WebSocket connections should work</strong> (if configured)</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}