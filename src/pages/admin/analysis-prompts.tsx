import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Save, RotateCcw, Check, AlertCircle, 
  Code, FileText, Cpu, DollarSign, Shield, Target,
  Edit3, Eye, ChevronDown, ChevronUp
} from 'lucide-react';
import { 
  getAllAnalysisPrompts, 
  validatePrompt, 
  type AnalysisPrompt 
} from '@/lib/prompts/analysis-prompts';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

export default function AnalysisPromptsConfig() {
  const [prompts, setPrompts] = useState<AnalysisPrompt[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<AnalysisPrompt | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errors, setErrors] = useState<string[]>([]);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  // Load prompts on mount
  useEffect(() => {
    loadPrompts();
  }, []);

  const loadPrompts = async () => {
    // First, try to load from database
    const { data: dbPrompts } = await supabase
      .from('admin_config')
      .select('*')
      .eq('config_type', 'analysis_prompt');

    if (dbPrompts && dbPrompts.length > 0) {
      const loadedPrompts = dbPrompts.map(p => p.config_value as AnalysisPrompt);
      setPrompts(loadedPrompts);
      setSelectedPrompt(loadedPrompts[0]);
    } else {
      // Load defaults
      const defaultPrompts = getAllAnalysisPrompts();
      setPrompts(defaultPrompts);
      setSelectedPrompt(defaultPrompts[0]);
    }
  };

  const savePrompt = async () => {
    if (!selectedPrompt) return;

    // Validate
    const validationErrors = validatePrompt(selectedPrompt);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSaveStatus('saving');
    setErrors([]);

    try {
      // Save to database
      const { error } = await supabase
        .from('admin_config')
        .upsert({
          config_type: 'analysis_prompt',
          config_key: selectedPrompt.id,
          config_value: selectedPrompt,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      // Update local state
      setPrompts(prev => prev.map(p => 
        p.id === selectedPrompt.id ? selectedPrompt : p
      ));

      setSaveStatus('saved');
      setEditMode(false);
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Failed to save prompt:', error);
      setSaveStatus('error');
      setErrors(['Failed to save prompt. Please try again.']);
    }
  };

  const resetPrompt = () => {
    if (!selectedPrompt) return;
    
    const defaultPrompt = getAllAnalysisPrompts().find(p => p.id === selectedPrompt.id);
    if (defaultPrompt) {
      setSelectedPrompt(defaultPrompt);
      setErrors([]);
    }
  };

  const updatePromptField = (field: keyof AnalysisPrompt, value: any) => {
    if (!selectedPrompt) return;
    
    setSelectedPrompt({
      ...selectedPrompt,
      [field]: value
    });
  };

  const getPromptIcon = (promptId: string) => {
    switch (promptId) {
      case 'tech-stack-analysis': return <Code className="h-5 w-5" />;
      case 'market-position-analysis': return <Target className="h-5 w-5" />;
      case 'team-culture-analysis': return <Cpu className="h-5 w-5" />;
      case 'financial-analysis': return <DollarSign className="h-5 w-5" />;
      case 'security-compliance-analysis': return <Shield className="h-5 w-5" />;
      case 'investment-synthesis': return <FileText className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Analysis Prompt Configuration</h1>
          <p className="text-gray-600 mt-2">
            Configure the AI prompts used for analyzing evidence and generating report sections
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Prompt List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Analysis Prompts</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-1">
                  {prompts.map(prompt => (
                    <button
                      key={prompt.id}
                      onClick={() => {
                        setSelectedPrompt(prompt);
                        setEditMode(false);
                        setErrors([]);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                        selectedPrompt?.id === prompt.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                      }`}
                    >
                      {getPromptIcon(prompt.id)}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{prompt.name}</p>
                        <p className="text-xs text-gray-500 truncate">{prompt.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Prompt Editor */}
          <div className="lg:col-span-3">
            {selectedPrompt ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {getPromptIcon(selectedPrompt.id)}
                        {selectedPrompt.name}
                      </CardTitle>
                      <CardDescription>{selectedPrompt.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {!editMode ? (
                        <Button onClick={() => setEditMode(true)} size="sm">
                          <Edit3 className="h-4 w-4 mr-2" />
                          Edit Prompt
                        </Button>
                      ) : (
                        <>
                          <Button onClick={resetPrompt} variant="outline" size="sm">
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Reset
                          </Button>
                          <Button onClick={savePrompt} size="sm" disabled={saveStatus === 'saving'}>
                            {saveStatus === 'saving' ? (
                              <>Saving...</>
                            ) : saveStatus === 'saved' ? (
                              <>
                                <Check className="h-4 w-4 mr-2" />
                                Saved
                              </>
                            ) : (
                              <>
                                <Save className="h-4 w-4 mr-2" />
                                Save Changes
                              </>
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {errors.length > 0 && (
                    <Alert variant="destructive" className="mb-6">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <ul className="list-disc list-inside">
                          {errors.map((error, i) => (
                            <li key={i}>{error}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-6">
                    {/* System Prompt */}
                    <div>
                      <div 
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => toggleSection('system')}
                      >
                        <Label className="text-base font-medium">System Prompt (AI Persona)</Label>
                        {expandedSections.system ? (
                          <ChevronUp className="h-4 w-4 text-gray-500" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-gray-500" />
                        )}
                      </div>
                      {expandedSections.system && (
                        <Textarea
                          value={selectedPrompt.systemPrompt}
                          onChange={(e) => updatePromptField('systemPrompt', e.target.value)}
                          disabled={!editMode}
                          rows={4}
                          className="mt-2 font-mono text-sm"
                          placeholder="Define the AI's role and expertise..."
                        />
                      )}
                    </div>

                    <Separator />

                    {/* Task Description */}
                    <div>
                      <Label className="text-base font-medium">Task Description</Label>
                      <Textarea
                        value={selectedPrompt.taskDescription}
                        onChange={(e) => updatePromptField('taskDescription', e.target.value)}
                        disabled={!editMode}
                        rows={3}
                        className="mt-2 font-mono text-sm"
                        placeholder="Describe what the AI should produce..."
                      />
                    </div>

                    <Separator />

                    {/* Input Context */}
                    <div>
                      <div 
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => toggleSection('input')}
                      >
                        <Label className="text-base font-medium">Input Context Variables</Label>
                        {expandedSections.input ? (
                          <ChevronUp className="h-4 w-4 text-gray-500" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-gray-500" />
                        )}
                      </div>
                      {expandedSections.input && (
                        <div className="mt-2 space-y-2">
                          {selectedPrompt.inputContext.map((input, index) => (
                            <Input
                              key={index}
                              value={input}
                              onChange={(e) => {
                                const newInputs = [...selectedPrompt.inputContext];
                                newInputs[index] = e.target.value;
                                updatePromptField('inputContext', newInputs);
                              }}
                              disabled={!editMode}
                              className="font-mono text-sm"
                              placeholder='e.g., 1. Company Name: "${companyName}"'
                            />
                          ))}
                          {editMode && (
                            <Button
                              onClick={() => {
                                updatePromptField('inputContext', [
                                  ...selectedPrompt.inputContext,
                                  ''
                                ]);
                              }}
                              variant="outline"
                              size="sm"
                              className="w-full"
                            >
                              Add Input Variable
                            </Button>
                          )}
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* Methodology */}
                    <div>
                      <div 
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => toggleSection('methodology')}
                      >
                        <Label className="text-base font-medium">Analysis Methodology</Label>
                        {expandedSections.methodology ? (
                          <ChevronUp className="h-4 w-4 text-gray-500" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-gray-500" />
                        )}
                      </div>
                      {expandedSections.methodology && (
                        <div className="mt-2 space-y-2">
                          {selectedPrompt.methodology.map((method, index) => (
                            <Textarea
                              key={index}
                              value={method}
                              onChange={(e) => {
                                const newMethods = [...selectedPrompt.methodology];
                                newMethods[index] = e.target.value;
                                updatePromptField('methodology', newMethods);
                              }}
                              disabled={!editMode}
                              rows={2}
                              className="font-mono text-sm"
                              placeholder="Define analysis rules and constraints..."
                            />
                          ))}
                          {editMode && (
                            <Button
                              onClick={() => {
                                updatePromptField('methodology', [
                                  ...selectedPrompt.methodology,
                                  ''
                                ]);
                              }}
                              variant="outline"
                              size="sm"
                              className="w-full"
                            >
                              Add Methodology Rule
                            </Button>
                          )}
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* Output Format */}
                    <div>
                      <div 
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => toggleSection('output')}
                      >
                        <Label className="text-base font-medium">Output Format (JSON Schema)</Label>
                        {expandedSections.output ? (
                          <ChevronUp className="h-4 w-4 text-gray-500" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-gray-500" />
                        )}
                      </div>
                      {expandedSections.output && (
                        <div className="mt-2">
                          <Textarea
                            value={selectedPrompt.outputFormat}
                            onChange={(e) => updatePromptField('outputFormat', e.target.value)}
                            disabled={!editMode}
                            rows={20}
                            className="font-mono text-xs"
                            placeholder="Define the expected JSON output structure..."
                          />
                          <div className="mt-2 flex items-center gap-2">
                            <Badge variant="outline">JSON Format</Badge>
                            <Button
                              onClick={() => {
                                try {
                                  const formatted = JSON.stringify(
                                    JSON.parse(selectedPrompt.outputFormat), 
                                    null, 
                                    2
                                  );
                                  updatePromptField('outputFormat', formatted);
                                } catch (e) {
                                  // Invalid JSON, ignore
                                }
                              }}
                              variant="ghost"
                              size="sm"
                              disabled={!editMode}
                            >
                              Format JSON
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-gray-500">
                  Select a prompt to view and edit
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Preview Section */}
        {selectedPrompt && (
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Prompt Preview
                </CardTitle>
                <CardDescription>
                  This is how the complete prompt will be sent to the AI
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-900 text-gray-100 p-6 rounded-lg font-mono text-sm overflow-x-auto">
                  <div className="mb-4">
                    <span className="text-purple-400">System:</span> {selectedPrompt.systemPrompt}
                  </div>
                  <div className="mb-4">
                    <span className="text-green-400"># Task Description</span><br />
                    {selectedPrompt.taskDescription}
                  </div>
                  <div className="mb-4">
                    <span className="text-green-400"># Input Context</span><br />
                    {selectedPrompt.inputContext.map((input, i) => (
                      <div key={i}>{input}</div>
                    ))}
                  </div>
                  <div className="mb-4">
                    <span className="text-green-400"># Methodology & Constraints</span><br />
                    {selectedPrompt.methodology.map((method, i) => (
                      <div key={i}>- {method}</div>
                    ))}
                  </div>
                  <div>
                    <span className="text-green-400"># Output Format</span><br />
                    <pre>{selectedPrompt.outputFormat}</pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}