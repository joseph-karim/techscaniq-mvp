import { useState } from 'react'
import { Check, ChevronsUpDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

// Mock thesis tags
const thesisTags = [
  { value: 'scalable-architecture', label: 'Scalable Architecture' },
  { value: 'modern-tech-stack', label: 'Modern Tech Stack' },
  { value: 'security-focus', label: 'Security Focus' },
  { value: 'devops-maturity', label: 'DevOps Maturity' },
  { value: 'cloud-native', label: 'Cloud Native' },
  { value: 'api-driven', label: 'API-Driven' },
  { value: 'microservices', label: 'Microservices' },
  { value: 'data-intensive', label: 'Data-Intensive' },
  { value: 'mobile-first', label: 'Mobile-First' },
  { value: 'low-technical-debt', label: 'Low Technical Debt' },
  { value: 'distributed-systems', label: 'Distributed Systems' },
  { value: 'high-availability', label: 'High Availability' },
  { value: 'test-coverage', label: 'Strong Test Coverage' },
  { value: 'containerized', label: 'Containerized' },
  { value: 'documentation', label: 'Well-Documented' },
]

interface ThesisTagSelectorProps {
  value: string[]
  onChange: (value: string[]) => void
}

export function ThesisTagSelector({ value, onChange }: ThesisTagSelectorProps) {
  const [open, setOpen] = useState(false)
  
  const selectedTags = value.map(v => {
    const tag = thesisTags.find(tag => tag.value === v)
    return tag || { value: v, label: v }
  })
  
  const handleSelect = (tagValue: string) => {
    if (value.includes(tagValue)) {
      onChange(value.filter(v => v !== tagValue))
    } else {
      onChange([...value, tagValue])
    }
  }
  
  const handleRemove = (tagValue: string) => {
    onChange(value.filter(v => v !== tagValue))
  }
  
  return (
    <div className="flex flex-col gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {value.length === 0 ? (
              <span className="text-muted-foreground">Select thesis tags...</span>
            ) : (
              <span className="truncate">{value.length} tag{value.length > 1 ? 's' : ''} selected</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Search tags..." />
            <CommandEmpty>No tags found.</CommandEmpty>
            <CommandGroup className="max-h-64 overflow-auto">
              {thesisTags.map((tag) => (
                <CommandItem
                  key={tag.value}
                  value={tag.value}
                  onSelect={() => handleSelect(tag.value)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value.includes(tag.value) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {tag.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
      
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map(tag => (
            <Badge 
              key={tag.value} 
              variant="secondary"
              className="flex items-center gap-1"
            >
              {tag.label}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => handleRemove(tag.value)}
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Remove {tag.label}</span>
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}