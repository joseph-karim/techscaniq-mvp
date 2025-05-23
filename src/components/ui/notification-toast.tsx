import { Bell, X } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Button } from './button'
import { useState, useEffect } from 'react'

interface NotificationToastProps {
  title: string
  message: string
  type?: 'info' | 'success' | 'warning' | 'error'
  onClose: () => void
  autoClose?: boolean
  duration?: number
}

export function NotificationToast({
  title,
  message,
  type = 'info',
  onClose,
  autoClose = true,
  duration = 5000,
}: NotificationToastProps) {
  const [isVisible, setIsVisible] = useState(true)
  
  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(onClose, 300) // Wait for exit animation
      }, duration)
      
      return () => clearTimeout(timer)
    }
  }, [autoClose, duration, onClose])
  
  return (
    <div
      className={cn(
        'fixed top-4 right-4 z-50 max-w-sm transition-all duration-300',
        isVisible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'
      )}
    >
      <Card className="shadow-lg border border-slate-200 dark:border-slate-700">
        <div className="flex p-4">
          <div className={cn(
            'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full',
            type === 'info' && 'bg-blue-100 text-blue-600',
            type === 'success' && 'bg-green-100 text-green-600',
            type === 'warning' && 'bg-yellow-100 text-yellow-600',
            type === 'error' && 'bg-red-100 text-red-600',
          )}>
            <Bell className="h-5 w-5" />
          </div>
          
          <div className="ml-3 flex-1">
            <h3 className="font-medium">{title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{message}</p>
            <div className="mt-2 flex gap-2">
              <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={onClose}>
                Dismiss
              </Button>
              {type === 'info' && (
                <Button 
                  size="sm" 
                  className="h-7 bg-electric-teal px-2 text-xs hover:bg-electric-teal/90"
                  onClick={onClose}
                >
                  View Details
                </Button>
              )}
            </div>
          </div>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 rounded-full p-0"
            onClick={() => {
              setIsVisible(false)
              setTimeout(onClose, 300)
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  )
}