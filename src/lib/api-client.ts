// API client configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (typeof window !== 'undefined' && window.location.hostname === 'scan.techscaniq.com' 
    ? 'https://scan.techscaniq.com:3001'
    : 'http://localhost:3001')

// Helper function for making authenticated API requests
export async function apiRequest(path: string, options?: RequestInit) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    credentials: 'include',
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(error || response.statusText)
  }

  return response.json()
}