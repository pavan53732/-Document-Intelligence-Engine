'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Settings, Key, Globe, Cpu, CheckCircle2, XCircle, Loader2, Plus, Trash2,
  Zap, Shield, AlertCircle, ExternalLink, Copy, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Preset configurations for popular providers
const PROVIDER_PRESETS = [
  {
    id: 'openai',
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'],
    defaultModel: 'gpt-4o-mini',
  },
  {
    id: 'azure',
    name: 'Azure OpenAI',
    baseUrl: 'https://YOUR_RESOURCE.openai.azure.com/openai/deployments/YOUR_DEPLOYMENT',
    models: ['gpt-4o', 'gpt-4', 'gpt-35-turbo'],
    defaultModel: 'gpt-4o',
  },
  {
    id: 'ollama',
    name: 'Ollama (Local)',
    baseUrl: 'http://localhost:11434/v1',
    models: ['llama3.2', 'llama3.1', 'mistral', 'codellama', 'phi3'],
    defaultModel: 'llama3.2',
  },
  {
    id: 'lmstudio',
    name: 'LM Studio (Local)',
    baseUrl: 'http://localhost:1234/v1',
    models: ['local-model'],
    defaultModel: 'local-model',
  },
  {
    id: 'groq',
    name: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    models: ['llama-3.3-70b-versatile', 'llama-3.1-70b-versatile', 'mixtral-8x7b-32768'],
    defaultModel: 'llama-3.3-70b-versatile',
  },
  {
    id: 'together',
    name: 'Together AI',
    baseUrl: 'https://api.together.xyz/v1',
    models: ['meta-llama/Llama-3-70b-chat-hf', 'mistralai/Mixtral-8x7B-Instruct-v0.1'],
    defaultModel: 'meta-llama/Llama-3-70b-chat-hf',
  },
  {
    id: 'anthropic',
    name: 'Anthropic (via proxy)',
    baseUrl: 'https://api.anthropic.com/v1',
    models: ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229', 'claude-3-haiku-20240307'],
    defaultModel: 'claude-3-5-sonnet-20241022',
  },
  {
    id: 'custom',
    name: 'Custom Endpoint',
    baseUrl: '',
    models: [],
    defaultModel: '',
  },
];

interface AISettingsState {
  configured: boolean;
  hasValidSettings: boolean;
  activeConfig: {
    name: string;
    displayName: string | null;
    modelName: string;
    baseUrl: string;
    validationStatus: string;
    totalApiCalls: number;
    totalTokensUsed: number;
  } | null;
}

interface SettingsForm {
  name: string;
  displayName: string;
  baseUrl: string;
  apiKey: string;
  modelName: string;
  maxTokens: number;
  temperature: number;
  isActive: boolean;
}

interface AISettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSettingsSaved?: () => void;
}

export function AISettingsModal({ open, onOpenChange, onSettingsSaved }: AISettingsModalProps) {
  const [status, setStatus] = useState<AISettingsState>({
    configured: false,
    hasValidSettings: false,
    activeConfig: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [validationResult, setValidationResult] = useState<{ valid: boolean; error?: string; models?: string[] } | null>(null);
  const [activeTab, setActiveTab] = useState('config');
  const [selectedProvider, setSelectedProvider] = useState('openai');
  const [savedSettingsId, setSavedSettingsId] = useState<string | null>(null);

  const [form, setForm] = useState<SettingsForm>({
    name: 'default',
    displayName: '',
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '',
    modelName: 'gpt-4o-mini',
    maxTokens: 4096,
    temperature: 0.7,
    isActive: true,
  });

  // Load status on mount
  useEffect(() => {
    if (open) loadStatus();
  }, [open]);

  const loadStatus = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/ai-settings?action=status');
      const data = await res.json();
      setStatus(data);
      if (data.activeConfig) {
        setSavedSettingsId(data.activeConfig.name);
      }
    } catch (error) {
      console.error('Failed to load AI status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProviderChange = (providerId: string) => {
    setSelectedProvider(providerId);
    const preset = PROVIDER_PRESETS.find(p => p.id === providerId);
    if (preset) {
      setForm(prev => ({
        ...prev,
        baseUrl: preset.baseUrl,
        modelName: preset.defaultModel,
        displayName: preset.name,
      }));
      setValidationResult(null);
    }
  };

  const handleValidate = async () => {
    if (!savedSettingsId && !form.apiKey) {
      return;
    }

    setIsValidating(true);
    setValidationResult(null);
    try {
      // First save, then validate
      const saveRes = await fetch('/api/ai-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save', ...form }),
      });
      const saveData = await saveRes.json();
      
      if (saveData.success) {
        setSavedSettingsId(saveData.settings.id);
        
        // Now validate
        const validateRes = await fetch('/api/ai-settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'validate', settingsId: saveData.settings.id }),
        });
        const validateData = await validateRes.json();
        setValidationResult(validateData);
        
        if (validateData.valid) {
          loadStatus();
          onSettingsSaved?.();
        }
      }
    } catch (error) {
      setValidationResult({ valid: false, error: error instanceof Error ? error.message : 'Validation failed' });
    } finally {
      setIsValidating(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/ai-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save', ...form }),
      });
      const data = await res.json();
      
      if (data.success) {
        setSavedSettingsId(data.settings.id);
        loadStatus();
        onSettingsSaved?.();
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadge = () => {
    if (!status.configured) {
      return <Badge variant="outline" className="text-muted-foreground">Not Configured</Badge>;
    }
    if (status.hasValidSettings) {
      return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Connected</Badge>;
    }
    return <Badge variant="destructive">Invalid</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20">
              <Settings className="w-5 h-5 text-purple-500" />
            </div>
            AI Configuration
            {getStatusBadge()}
          </DialogTitle>
          <DialogDescription>
            Configure your OpenAI-compatible AI provider. Supports OpenAI, Azure, Ollama, LM Studio, Groq, Together AI, and more.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
          <TabsList className="w-full">
            <TabsTrigger value="config" className="flex-1">Configuration</TabsTrigger>
            <TabsTrigger value="advanced" className="flex-1">Advanced</TabsTrigger>
            <TabsTrigger value="providers" className="flex-1">Providers</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[400px] mt-4">
            <TabsContent value="config" className="space-y-4 mt-0">
              {/* Provider Selection */}
              <div className="space-y-2">
                <Label>Provider Preset</Label>
                <Select value={selectedProvider} onValueChange={handleProviderChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROVIDER_PRESETS.map(provider => (
                      <SelectItem key={provider.id} value={provider.id}>
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4" />
                          {provider.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Base URL */}
              <div className="space-y-2">
                <Label htmlFor="baseUrl" className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Base URL
                </Label>
                <Input
                  id="baseUrl"
                  placeholder="https://api.openai.com/v1"
                  value={form.baseUrl}
                  onChange={(e) => setForm(prev => ({ ...prev, baseUrl: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  The API endpoint URL (e.g., https://api.openai.com/v1)
                </p>
              </div>

              {/* API Key */}
              <div className="space-y-2">
                <Label htmlFor="apiKey" className="flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  API Key
                </Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="sk-..."
                  value={form.apiKey}
                  onChange={(e) => setForm(prev => ({ ...prev, apiKey: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  Your API key is encrypted and stored locally
                </p>
              </div>

              {/* Model Selection */}
              <div className="space-y-2">
                <Label htmlFor="modelName" className="flex items-center gap-2">
                  <Cpu className="w-4 h-4" />
                  Model Name
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="modelName"
                    placeholder="gpt-4o-mini"
                    value={form.modelName}
                    onChange={(e) => setForm(prev => ({ ...prev, modelName: e.target.value }))}
                    className="flex-1"
                  />
                  {selectedProvider !== 'custom' && (
                    <Select value={form.modelName} onValueChange={(v) => setForm(prev => ({ ...prev, modelName: v }))}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select model" />
                      </SelectTrigger>
                      <SelectContent>
                        {PROVIDER_PRESETS.find(p => p.id === selectedProvider)?.models.map(model => (
                          <SelectItem key={model} value={model}>{model}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              {/* Validation Result */}
              <AnimatePresence>
                {validationResult && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <Alert className={validationResult.valid ? 'border-green-500/50 bg-green-500/10' : 'border-red-500/50 bg-red-500/10'}>
                      <div className="flex items-center gap-2">
                        {validationResult.valid ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-500" />
                        )}
                        <span className={validationResult.valid ? 'text-green-500' : 'text-red-500'}>
                          {validationResult.valid ? 'Connection successful!' : validationResult.error}
                        </span>
                      </div>
                    </Alert>
                  </motion.div>
                )}
              </AnimatePresence>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4 mt-0">
              {/* Display Name */}
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name (Optional)</Label>
                <Input
                  id="displayName"
                  placeholder="My AI Config"
                  value={form.displayName}
                  onChange={(e) => setForm(prev => ({ ...prev, displayName: e.target.value }))}
                />
              </div>

              {/* Max Tokens */}
              <div className="space-y-2">
                <Label htmlFor="maxTokens">Max Tokens: {form.maxTokens}</Label>
                <Slider
                  value={[form.maxTokens]}
                  onValueChange={([value]) => setForm(prev => ({ ...prev, maxTokens: value }))}
                  min={256}
                  max={32000}
                  step={256}
                />
              </div>

              {/* Temperature */}
              <div className="space-y-2">
                <Label htmlFor="temperature">Temperature: {form.temperature.toFixed(2)}</Label>
                <Slider
                  value={[form.temperature]}
                  onValueChange={([value]) => setForm(prev => ({ ...prev, temperature: value }))}
                  min={0}
                  max={2}
                  step={0.05}
                />
                <p className="text-xs text-muted-foreground">
                  Lower = more deterministic, Higher = more creative
                </p>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between">
                <Label htmlFor="isActive" className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Set as Active Configuration
                </Label>
                <Switch
                  id="isActive"
                  checked={form.isActive}
                  onCheckedChange={(checked) => setForm(prev => ({ ...prev, isActive: checked }))}
                />
              </div>

              {/* Stats */}
              {status.activeConfig && (
                <Card className="bg-muted/50">
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm">Usage Statistics</CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">API Calls</p>
                        <p className="font-bold">{status.activeConfig.totalApiCalls.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Tokens Used</p>
                        <p className="font-bold">{status.activeConfig.totalTokensUsed.toLocaleString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="providers" className="space-y-2 mt-0">
              <p className="text-sm text-muted-foreground mb-4">
                Click on a provider to quickly configure your settings.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {PROVIDER_PRESETS.filter(p => p.id !== 'custom').map(provider => (
                  <Card
                    key={provider.id}
                    className={`cursor-pointer transition-all hover:border-primary/50 ${
                      selectedProvider === provider.id ? 'border-primary bg-primary/5' : ''
                    }`}
                    onClick={() => handleProviderChange(provider.id)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium text-sm">{provider.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {provider.baseUrl || 'Custom endpoint'}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={handleValidate}
            disabled={isValidating || !form.apiKey}
          >
            {isValidating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Validate
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !form.apiKey || !form.baseUrl || !form.modelName}
            className="bg-gradient-to-r from-purple-500 to-blue-500"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4 mr-2" />
            )}
            Save Configuration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Compact status indicator for the header
export function AIStatusIndicator({ onClick }: { onClick: () => void }) {
  const [status, setStatus] = useState<AISettingsState>({
    configured: false,
    hasValidSettings: false,
    activeConfig: null,
  });

  useEffect(() => {
    fetch('/api/ai-settings?action=status')
      .then(res => res.json())
      .then(data => setStatus(data))
      .catch(console.error);
  }, []);

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className="gap-2"
    >
      {status.hasValidSettings ? (
        <>
          <CheckCircle2 className="w-4 h-4 text-green-500" />
          <span className="hidden sm:inline text-xs">{status.activeConfig?.modelName}</span>
        </>
      ) : status.configured ? (
        <>
          <AlertCircle className="w-4 h-4 text-amber-500" />
          <span className="hidden sm:inline text-xs">Invalid Config</span>
        </>
      ) : (
        <>
          <Settings className="w-4 h-4 text-muted-foreground" />
          <span className="hidden sm:inline text-xs">Setup AI</span>
        </>
      )}
    </Button>
  );
}
