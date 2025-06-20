import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface TestResult {
  name: string;
  status: 'success' | 'error' | 'pending';
  message: string;
}

export default function CSPTestPage() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [testing, setTesting] = useState(false);

  const updateResult = (name: string, status: TestResult['status'], message: string) => {
    setResults(prev => {
      const existing = prev.findIndex(r => r.name === name);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { name, status, message };
        return updated;
      }
      return [...prev, { name, status, message }];
    });
  };

  const runCSPTests = async () => {
    setTesting(true);
    setResults([]);

    // Test 1: API Connection
    updateResult('API Connection', 'pending', 'Testing API connection...');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://techscaniq-mvp.onrender.com/api'}/health`);
      if (response.ok) {
        updateResult('API Connection', 'success', 'API connection successful');
      } else {
        updateResult('API Connection', 'error', `API returned ${response.status}`);
      }
    } catch (error) {
      updateResult('API Connection', 'error', `Failed: ${error.message}`);
    }

    // Test 2: External Scripts
    updateResult('External Scripts', 'pending', 'Testing external script loading...');
    try {
      const script = document.createElement('script');
      script.src = 'https://cdn.tailwindcss.com/test.js';
      script.onload = () => updateResult('External Scripts', 'success', 'External scripts can load');
      script.onerror = () => updateResult('External Scripts', 'error', 'CSP blocks external scripts');
      document.head.appendChild(script);
    } catch (error) {
      updateResult('External Scripts', 'error', `Failed: ${error.message}`);
    }

    // Test 3: Inline Styles
    updateResult('Inline Styles', 'pending', 'Testing inline styles...');
    try {
      const div = document.createElement('div');
      div.style.color = 'red';
      document.body.appendChild(div);
      const computed = window.getComputedStyle(div);
      if (computed.color === 'rgb(255, 0, 0)') {
        updateResult('Inline Styles', 'success', 'Inline styles are allowed');
      } else {
        updateResult('Inline Styles', 'error', 'Inline styles are blocked');
      }
      document.body.removeChild(div);
    } catch (error) {
      updateResult('Inline Styles', 'error', `Failed: ${error.message}`);
    }

    // Test 4: Font Loading
    updateResult('Font Loading', 'pending', 'Testing Google Fonts...');
    try {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Roboto&display=swap';
      link.onload = () => updateResult('Font Loading', 'success', 'External fonts can load');
      link.onerror = () => updateResult('Font Loading', 'error', 'CSP blocks font loading');
      document.head.appendChild(link);
    } catch (error) {
      updateResult('Font Loading', 'error', `Failed: ${error.message}`);
    }

    // Test 5: WebSocket Connection
    updateResult('WebSocket', 'pending', 'Testing WebSocket connection...');
    try {
      const ws = new WebSocket('wss://echo.websocket.org');
      ws.onopen = () => {
        updateResult('WebSocket', 'success', 'WebSocket connections allowed');
        ws.close();
      };
      ws.onerror = () => updateResult('WebSocket', 'error', 'CSP blocks WebSocket');
    } catch (error) {
      updateResult('WebSocket', 'error', `Failed: ${error.message}`);
    }

    // Test 6: Worker
    updateResult('Web Worker', 'pending', 'Testing Web Worker...');
    try {
      const workerCode = `self.postMessage('Worker running');`;
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const worker = new Worker(URL.createObjectURL(blob));
      worker.onmessage = () => {
        updateResult('Web Worker', 'success', 'Web Workers are allowed');
        worker.terminate();
      };
      worker.onerror = () => updateResult('Web Worker', 'error', 'CSP blocks Web Workers');
    } catch (error) {
      updateResult('Web Worker', 'error', `Failed: ${error.message}`);
    }

    // Test 7: Data URI Images
    updateResult('Data URI Images', 'pending', 'Testing data URI images...');
    try {
      const img = new Image();
      img.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      img.onload = () => updateResult('Data URI Images', 'success', 'Data URI images allowed');
      img.onerror = () => updateResult('Data URI Images', 'error', 'CSP blocks data URI images');
    } catch (error) {
      updateResult('Data URI Images', 'error', `Failed: ${error.message}`);
    }

    setTimeout(() => setTesting(false), 3000);
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>CSP Configuration Test</CardTitle>
          <CardDescription>
            Test various CSP directives to ensure the application can function properly
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button 
              onClick={runCSPTests} 
              disabled={testing}
              className="w-full"
            >
              {testing ? 'Running Tests...' : 'Run CSP Tests'}
            </Button>

            {results.length > 0 && (
              <div className="space-y-2">
                {results.map((result, idx) => (
                  <Alert key={idx} className={
                    result.status === 'success' ? 'border-green-200 bg-green-50' :
                    result.status === 'error' ? 'border-red-200 bg-red-50' :
                    'border-yellow-200 bg-yellow-50'
                  }>
                    <div className="flex items-center gap-2">
                      {result.status === 'success' ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : result.status === 'error' ? (
                        <XCircle className="h-4 w-4 text-red-600" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      )}
                      <AlertDescription>
                        <strong>{result.name}:</strong> {result.message}
                      </AlertDescription>
                    </div>
                  </Alert>
                ))}
              </div>
            )}

            <div className="mt-6 p-4 bg-gray-100 rounded-lg">
              <h3 className="font-semibold mb-2">Current CSP Policy</h3>
              <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
                {document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.getAttribute('content') || 
                 'CSP is configured via server headers (check Network tab)'}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}