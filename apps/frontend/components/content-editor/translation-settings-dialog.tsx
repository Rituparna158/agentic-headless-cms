'use client';

import { useState, useEffect } from 'react';
import { Button, Input, Modal, Badge } from '@repo/shared-ui';
import {
  Sparkles,
  Globe,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Server,
  Key,
} from 'lucide-react';
import {
  type TranslationConfig,
  type TranslationProviderType,
  getTranslationConfig,
  saveTranslationConfig,
  testTranslationProvider,
} from '@/lib/services/translation-service';
import { toast } from 'sonner';

export interface TranslationSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfigChange?: (config: TranslationConfig) => void;
}

export function TranslationSettingsDialog({
  open,
  onOpenChange,
  onConfigChange,
}: TranslationSettingsDialogProps) {
  const [provider, setProvider] = useState<TranslationProviderType>('free');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('gpt-4o-mini');
  const [customEndpoint, setCustomEndpoint] = useState('');

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    sample?: string;
  } | null>(null);

  useEffect(() => {
    if (open) {
      const current = getTranslationConfig();
      setProvider(current.provider);
      setApiKey(current.apiKey || '');
      setModel(current.model || 'gpt-4o-mini');
      setCustomEndpoint(current.customEndpoint || '');
      setTestResult(null);
    }
  }, [open]);

  async function handleTest() {
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await testTranslationProvider({
        provider,
        apiKey,
        model,
        customEndpoint,
      });
      setTestResult(result);
    } catch (err) {
      setTestResult({
        success: false,
        message: err instanceof Error ? err.message : 'Connection test failed',
      });
    } finally {
      setIsTesting(false);
    }
  }

  function handleSave() {
    if (provider === 'openai' && !apiKey.trim()) {
      toast.error(
        'Please enter an OpenAI API Key or switch to Free translation.',
      );
      return;
    }
    if (provider === 'custom' && !customEndpoint.trim()) {
      toast.error('Please enter a valid custom translation endpoint URL.');
      return;
    }

    const newConfig: TranslationConfig = {
      provider,
      apiKey: apiKey.trim(),
      model: model.trim() || 'gpt-4o-mini',
      customEndpoint: customEndpoint.trim(),
    };

    saveTranslationConfig(newConfig);
    onConfigChange?.(newConfig);
    toast.success(
      `Translation provider set to ${
        provider === 'free'
          ? 'Free Machine Translation'
          : provider === 'openai'
            ? 'OpenAI'
            : 'Custom Endpoint'
      }`,
    );
    onOpenChange(false);
  }

  return (
    <Modal
      isOpen={open}
      onClose={() => onOpenChange(false)}
      title="Translation Provider Settings"
      showFooter={false}
    >
      <div className="space-y-5 py-3 text-sm">
        <p className="text-muted-foreground text-xs leading-relaxed">
          Configure how automated translations are generated when translating
          content entries across multiple locales.
        </p>

        {/* Provider Option Cards */}
        <div className="grid gap-2.5">
          <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
            Select Provider
          </label>

          {/* Option: Free Zero-Config */}
          <div
            onClick={() => setProvider('free')}
            className={`cursor-pointer rounded-lg border p-3 transition-colors flex items-start gap-3 ${
              provider === 'free'
                ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                : 'border-border/70 hover:bg-muted/40'
            }`}
          >
            <input
              type="radio"
              name="provider"
              checked={provider === 'free'}
              onChange={() => setProvider('free')}
              className="mt-0.5 text-primary focus:ring-primary"
            />
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <Globe className="size-4 text-primary" />
                <span className="font-semibold text-foreground text-xs">
                  Free Machine Translation (Zero-Config)
                </span>
                <Badge
                  variant="outline"
                  size="sm"
                  className="text-xs font-medium px-2 py-0.5"
                >
                  Default
                </Badge>
              </div>
              <p className="text-muted-foreground text-xs">
                No API keys required. Ready to translate immediately in standard
                locales using public translation gateways.
              </p>
            </div>
          </div>

          {/* Option: OpenAI API */}
          <div
            onClick={() => setProvider('openai')}
            className={`cursor-pointer rounded-lg border p-3 transition-colors flex items-start gap-3 ${
              provider === 'openai'
                ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                : 'border-border/70 hover:bg-muted/40'
            }`}
          >
            <input
              type="radio"
              name="provider"
              checked={provider === 'openai'}
              onChange={() => setProvider('openai')}
              className="mt-0.5 text-primary focus:ring-primary"
            />
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />
                <span className="font-semibold text-foreground text-xs">
                  OpenAI (GPT-4o / GPT-4o-mini)
                </span>
                <Badge variant="secondary" size="xs" className="text-[10px]">
                  High Accuracy
                </Badge>
              </div>
              <p className="text-muted-foreground text-xs">
                Uses OpenAI language models with prompt formatting to maintain
                rich text formatting and contextual nuances.
              </p>
            </div>
          </div>

          {/* Option: Custom API Endpoint */}
          <div
            onClick={() => setProvider('custom')}
            className={`cursor-pointer rounded-lg border p-3 transition-colors flex items-start gap-3 ${
              provider === 'custom'
                ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                : 'border-border/70 hover:bg-muted/40'
            }`}
          >
            <input
              type="radio"
              name="provider"
              checked={provider === 'custom'}
              onChange={() => setProvider('custom')}
              className="mt-0.5 text-primary focus:ring-primary"
            />
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <Server className="size-4 text-primary" />
                <span className="font-semibold text-foreground text-xs">
                  Custom Translation Endpoint
                </span>
              </div>
              <p className="text-muted-foreground text-xs">
                Connect an internal enterprise translation service,
                microservice, or self-hosted LLM endpoint.
              </p>
            </div>
          </div>
        </div>

        {/* Dynamic Provider Configuration Fields */}
        {provider === 'openai' && (
          <div className="space-y-3 rounded-lg border border-border/80 bg-muted/20 p-3.5 animate-in fade-in-50">
            <div className="space-y-1.5">
              <label className="text-xs font-medium flex items-center gap-1.5">
                <Key className="size-3.5 text-muted-foreground" />
                <span>OpenAI API Key</span>
                <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="sk-..."
                value={apiKey}
                onChange={(val: string) => setApiKey(val)}
                showPasswordToggle={true}
                size="sm"
                variant="default"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Model Name
              </label>
              <Input
                placeholder="gpt-4o-mini"
                value={model}
                onChange={(val: string) => setModel(val)}
                size="sm"
                variant="default"
              />
            </div>
          </div>
        )}

        {provider === 'custom' && (
          <div className="space-y-3 rounded-lg border border-border/80 bg-muted/20 p-3.5 animate-in fade-in-50">
            <div className="space-y-1.5">
              <label className="text-xs font-medium flex items-center gap-1.5">
                <Server className="size-3.5 text-muted-foreground" />
                <span>Endpoint URL</span>
                <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="https://my-internal-translator.corp/translate"
                value={customEndpoint}
                onChange={(val: string) => setCustomEndpoint(val)}
                size="sm"
                variant="default"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Authorization Token / API Key (Optional)
              </label>
              <Input
                placeholder="Bearer token or secret"
                value={apiKey}
                onChange={(val: string) => setApiKey(val)}
                showPasswordToggle={true}
                size="sm"
                variant="default"
              />
            </div>
          </div>
        )}

        {/* Connection Test Feedback */}
        {testResult && (
          <div
            className={`rounded-lg border p-3 text-xs flex items-start gap-2.5 ${
              testResult.success
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                : 'border-destructive/30 bg-destructive/10 text-destructive'
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="size-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertCircle className="size-4 shrink-0 mt-0.5 text-destructive" />
            )}
            <div className="space-y-0.5">
              <p className="font-semibold">{testResult.message}</p>
              {testResult.sample && (
                <p className="text-[11px] opacity-90">
                  Sample: &ldquo;{testResult.sample}&rdquo;
                </p>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-border/60">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleTest}
            disabled={isTesting}
            className="gap-1.5 text-xs h-8"
          >
            {isTesting ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Sparkles className="size-3.5" />
            )}
            <span>Test Connection</span>
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs h-8"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              className="text-xs h-8"
            >
              Save Configuration
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
