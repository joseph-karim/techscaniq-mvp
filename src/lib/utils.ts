import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(input: string | number | Date): string {
  const date = new Date(input)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatDateTime(input: string | number | Date): string {
  const date = new Date(input)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  })
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) {
    return str
  }
  
  return str.slice(0, length) + '...'
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch (e) {
    return false
  }
}