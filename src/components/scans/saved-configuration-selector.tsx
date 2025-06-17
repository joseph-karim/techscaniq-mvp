import { useState, useEffect } from 'react'
import { Plus, Save, Check } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/lib/auth/auth-provider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import type { SavedInvestmentThesis, SavedVendorProfile } from '@/types/saved-configurations'

interface BaseSavedConfigurationSelectorProps {
  className?: string
  currentConfig?: any
}

interface InvestmentThesisSelectorProps extends BaseSavedConfigurationSelectorProps {
  type: 'investment-thesis'
  onSelect: (config: SavedInvestmentThesis | null) => void
}

interface VendorProfileSelectorProps extends BaseSavedConfigurationSelectorProps {
  type: 'vendor-profile'
  onSelect: (config: SavedVendorProfile | null) => void
}

type SavedConfigurationSelectorProps = InvestmentThesisSelectorProps | VendorProfileSelectorProps

export function SavedConfigurationSelector({
  type,
  onSelect,
  currentConfig,
  className,
}: SavedConfigurationSelectorProps) {
  const { user } = useAuth()
  const [configurations, setConfigurations] = useState<(SavedInvestmentThesis | SavedVendorProfile)[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [saveDescription, setSaveDescription] = useState('')
  const [makeDefault, setMakeDefault] = useState(false)

  const tableName = type === 'investment-thesis' ? 'saved_investment_thesis' : 'saved_vendor_profiles'
  const configLabel = type === 'investment-thesis' ? 'Investment Thesis' : 'Vendor Profile'

  useEffect(() => {
    loadConfigurations()
  }, [user])

  async function loadConfigurations() {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error

      setConfigurations(data || [])
      
      // Auto-select default if exists
      const defaultConfig = data?.find(c => c.is_default)
      if (defaultConfig) {
        setSelectedId(defaultConfig.id)
        if (type === 'investment-thesis') {
          (onSelect as InvestmentThesisSelectorProps['onSelect'])(defaultConfig as SavedInvestmentThesis)
        } else {
          (onSelect as VendorProfileSelectorProps['onSelect'])(defaultConfig as SavedVendorProfile)
        }
      }
    } catch (error) {
      console.error('Error loading configurations:', error)
      toast.error(`Failed to load saved ${configLabel.toLowerCase()}s`)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSaveConfiguration() {
    if (!user || !saveName || !currentConfig) return

    setIsSaving(true)
    try {
      const configData = {
        user_id: user.id,
        name: saveName,
        description: saveDescription || null,
        is_default: makeDefault,
        ...currentConfig,
      }

      const { error } = await supabase
        .from(tableName)
        .insert(configData)

      if (error) throw error

      toast.success(`${configLabel} saved successfully`)
      setShowSaveDialog(false)
      setSaveName('')
      setSaveDescription('')
      setMakeDefault(false)
      await loadConfigurations()
    } catch (error) {
      console.error('Error saving configuration:', error)
      toast.error(`Failed to save ${configLabel.toLowerCase()}`)
    } finally {
      setIsSaving(false)
    }
  }

  function handleSelectChange(value: string) {
    if (value === 'new') {
      setSelectedId(null)
      onSelect(null)
    } else {
      setSelectedId(value)
      const config = configurations.find(c => c.id === value)
      if (config) {
        if (type === 'investment-thesis') {
          (onSelect as InvestmentThesisSelectorProps['onSelect'])(config as SavedInvestmentThesis)
        } else {
          (onSelect as VendorProfileSelectorProps['onSelect'])(config as SavedVendorProfile)
        }
      }
    }
  }

  if (isLoading) {
    return <div className="animate-pulse h-10 bg-gray-200 rounded" />
  }

  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <Label htmlFor="saved-config">Saved {configLabel}s</Label>
          <Select value={selectedId || 'new'} onValueChange={handleSelectChange}>
            <SelectTrigger id="saved-config">
              <SelectValue placeholder={`Select a saved ${configLabel.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">
                <div className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create new {configLabel.toLowerCase()}
                </div>
              </SelectItem>
              {configurations.map((config) => (
                <SelectItem key={config.id} value={config.id}>
                  <div className="flex items-center gap-2">
                    {config.is_default && <Check className="h-4 w-4 text-green-500" />}
                    <span>{config.name}</span>
                    {config.description && (
                      <span className="text-muted-foreground text-sm">
                        - {config.description}
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {currentConfig && (
          <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
            <DialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-6"
              >
                <Save className="h-4 w-4 mr-2" />
                Save {configLabel}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Save {configLabel}</DialogTitle>
                <DialogDescription>
                  Save your current {configLabel.toLowerCase()} configuration for future use
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="save-name">Name</Label>
                  <Input
                    id="save-name"
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    placeholder={`e.g., Default ${configLabel}, Q1 2024 Strategy`}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="save-description">Description (Optional)</Label>
                  <Input
                    id="save-description"
                    value={saveDescription}
                    onChange={(e) => setSaveDescription(e.target.value)}
                    placeholder="Brief description of this configuration"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="make-default"
                    checked={makeDefault}
                    onCheckedChange={(checked) => setMakeDefault(checked as boolean)}
                  />
                  <Label
                    htmlFor="make-default"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Set as default {configLabel.toLowerCase()}
                  </Label>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowSaveDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSaveConfiguration}
                  disabled={!saveName || isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {selectedId && configurations.find(c => c.id === selectedId)?.description && (
        <Alert className="mt-2">
          <AlertDescription className="text-sm">
            {configurations.find(c => c.id === selectedId)?.description}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}