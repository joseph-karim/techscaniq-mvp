import { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface CSPViolation {
  timestamp: Date;
  blockedURI: string;
  violatedDirective: string;
  sourceFile: string;
  lineNumber: number;
  columnNumber: number;
}

export function CSPDebugger() {
  const [violations, setViolations] = useState<CSPViolation[]>([]);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleViolation = (e: SecurityPolicyViolationEvent) => {
      const violation: CSPViolation = {
        timestamp: new Date(),
        blockedURI: e.blockedURI,
        violatedDirective: e.violatedDirective,
        sourceFile: e.sourceFile || 'unknown',
        lineNumber: e.lineNumber || 0,
        columnNumber: e.columnNumber || 0,
      };

      setViolations(prev => [...prev, violation]);
      console.error('CSP Violation detected:', violation);
    };

    window.addEventListener('securitypolicyviolation', handleViolation);
    return () => window.removeEventListener('securitypolicyviolation', handleViolation);
  }, []);

  if (!isVisible || violations.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 max-w-md z-50">
      <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-900/20">
        <AlertTriangle className="h-4 w-4 text-orange-600" />
        <AlertTitle className="flex items-center justify-between">
          CSP Violations Detected ({violations.length})
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVisible(false)}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </AlertTitle>
        <AlertDescription>
          <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
            {violations.slice(-5).map((violation, idx) => (
              <div key={idx} className="text-xs border-t border-orange-200 pt-2">
                <p className="font-medium">{violation.violatedDirective}</p>
                <p className="text-orange-700">Blocked: {violation.blockedURI}</p>
                <p className="text-gray-600">
                  {violation.sourceFile}:{violation.lineNumber}:{violation.columnNumber}
                </p>
              </div>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-3 w-full"
            onClick={() => {
              console.table(violations);
              navigator.clipboard.writeText(JSON.stringify(violations, null, 2));
            }}
          >
            Copy Violations to Clipboard
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
}