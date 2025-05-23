import { useState } from 'react'

export function useTooltip() {
  const [tooltip, setTooltip] = useState<string | null>(null)
  
  return {
    tooltip,
    setTooltip,
  }
}