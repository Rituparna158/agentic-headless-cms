'use client';

import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Badge,
  Button,
  Input,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@repo/shared-ui';
import type { PluginSummary } from '@/lib/api/plugins';
import { useUpdatePluginConfig } from '@/hooks/use-plugins';
import {
  Zap,
  Network,
  KeyRound,
  Plus,
  Trash2,
  Save,
  Lock,
  Code2,
  FileJson,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  Blocks,
  Copy,
} from 'lucide-react';
import { toast } from 'sonner';

const HOOK_DESCRIPTIONS: Record<string, string> = {
  'content.beforeCreate':
    'Runs before a new content entry is saved. Can validate or alter field data.',
  'content.afterCreate':
    'Fires immediately after a new content entry is created. Useful for indexing or webhooks.',
  'content.beforeUpdate':
    'Runs before updating existing content. Can inspect previous state and sanitize changes.',
  'content.afterUpdate':
    'Fires after content updates are committed to the database.',
  'content.beforeDelete': 'Runs before an entry is soft-deleted or removed.',
  'content.afterDelete':
    'Fires after an entry is removed. Useful for cache invalidation.',
  'content.beforePublish': 'Validates requirements before content goes live.',
  'content.afterPublish':
    'Fires immediately after content is published. Ideal for updating sitemaps and pinging search engines.',
  'content.beforeUnpublish': 'Runs before taking live content offline.',
  'content.afterUnpublish': 'Fires after live content is unpublished.',
  'schema.beforeCreate':
    'Inspects new content-type schema definitions before registration.',
  'schema.afterCreate': 'Fires after a new content-type schema is created.',
  'schema.beforeUpdate': 'Runs before schema changes are committed.',
  'schema.afterUpdate': 'Fires after schema modifications are committed.',
};

interface PluginConfigDrawerProps {
  plugin: PluginSummary | null;
  isOpen: boolean;
  isAdmin: boolean;
  onClose: () => void;
}

interface ConfigEntry {
  key: string;
  value: string;
  isSecret: boolean;
}

export function PluginConfigDrawer({
  plugin,
  isOpen,
  isAdmin,
  onClose,
}: PluginConfigDrawerProps) {
  const [editorMode, setEditorMode] = useState<'form' | 'json'>('form');
  const [entries, setEntries] = useState<ConfigEntry[]>([]);
  const [jsonText, setJsonText] = useState('{}');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [revealedSecrets, setRevealedSecrets] = useState<
    Record<number, boolean>
  >({});

  const updateConfigMutation = useUpdatePluginConfig();

  // Sync state whenever the selected plugin changes
  useEffect(() => {
    if (!plugin) {
      setEntries([]);
      setJsonText('{}');
      setJsonError(null);
      return;
    }

    const cfg = plugin.config ?? {};
    const parsedEntries: ConfigEntry[] = Object.entries(cfg).map(([k, v]) => {
      const valStr =
        typeof v === 'object' && v !== null
          ? JSON.stringify(v)
          : String(v ?? '');
      const isSecret =
        valStr.includes('***') ||
        k.toLowerCase().includes('secret') ||
        k.toLowerCase().includes('key') ||
        k.toLowerCase().includes('token') ||
        k.toLowerCase().includes('password');

      return {
        key: k,
        value: valStr,
        isSecret,
      };
    });

    setEntries(parsedEntries);
    setJsonText(JSON.stringify(cfg, null, 2));
    setJsonError(null);
    setRevealedSecrets({});
  }, [plugin]);

  if (!plugin) return null;

  const handleAddEntry = () => {
    setEntries((prev) => [...prev, { key: '', value: '', isSecret: false }]);
  };

  const handleRemoveEntry = (index: number) => {
    setEntries((prev) => prev.filter((_, i) => i !== index));
  };

  const handleEntryChange = (
    index: number,
    field: 'key' | 'value',
    val: string,
  ) => {
    setEntries((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: val } : item)),
    );
  };

  const handleToggleSecretReveal = (index: number) => {
    setRevealedSecrets((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const serializeEntriesToConfig = (
    items: ConfigEntry[],
  ): Record<string, unknown> => {
    const configObj: Record<string, unknown> = {};
    for (const entry of items) {
      const trimmedKey = entry.key.trim();
      if (!trimmedKey) continue;

      let parsedVal: unknown = entry.value;
      if (entry.value === 'true') parsedVal = true;
      else if (entry.value === 'false') parsedVal = false;
      else if (!isNaN(Number(entry.value)) && entry.value.trim() !== '') {
        parsedVal = Number(entry.value);
      } else if (
        (entry.value.startsWith('{') && entry.value.endsWith('}')) ||
        (entry.value.startsWith('[') && entry.value.endsWith(']'))
      ) {
        try {
          parsedVal = JSON.parse(entry.value);
        } catch {
          parsedVal = entry.value;
        }
      }
      configObj[trimmedKey] = parsedVal;
    }
    return configObj;
  };

  const switchToJsonMode = () => {
    const cfg = serializeEntriesToConfig(entries);
    setJsonText(JSON.stringify(cfg, null, 2));
    setJsonError(null);
    setEditorMode('json');
  };

  const switchToFormMode = () => {
    try {
      const parsed = JSON.parse(jsonText);
      if (
        typeof parsed !== 'object' ||
        parsed === null ||
        Array.isArray(parsed)
      ) {
        toast.error(
          'JSON configuration must be an object with key-value pairs.',
        );
        return;
      }
      const newEntries: ConfigEntry[] = Object.entries(parsed).map(([k, v]) => {
        const valStr =
          typeof v === 'object' && v !== null
            ? JSON.stringify(v)
            : String(v ?? '');
        const isSecret =
          valStr.includes('***') ||
          k.toLowerCase().includes('secret') ||
          k.toLowerCase().includes('key') ||
          k.toLowerCase().includes('token') ||
          k.toLowerCase().includes('password');

        return { key: k, value: valStr, isSecret };
      });
      setEntries(newEntries);
      setJsonError(null);
      setEditorMode('form');
    } catch {
      toast.error('Cannot switch to Key-Value: JSON has syntax errors.');
    }
  };

  const handleJsonChange = (val: string) => {
    setJsonText(val);
    try {
      JSON.parse(val);
      setJsonError(null);
    } catch (err: unknown) {
      setJsonError((err as Error).message);
    }
  };

  const handleSave = async () => {
    if (!isAdmin) {
      toast.error('Admin privileges required to modify configuration.');
      return;
    }

    let finalConfig: Record<string, unknown> = {};

    if (editorMode === 'json') {
      try {
        finalConfig = JSON.parse(jsonText) as Record<string, unknown>;
      } catch {
        toast.error('Cannot save invalid JSON.');
        return;
      }
    } else {
      finalConfig = serializeEntriesToConfig(entries);
      setJsonText(JSON.stringify(finalConfig, null, 2));
    }

    try {
      await updateConfigMutation.mutateAsync({
        id: plugin.id,
        config: finalConfig,
      });
      onClose();
    } catch {
      // Mutation handles error toast
    }
  };

  const isSaving = updateConfigMutation.isPending;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      position="right"
      size="560px"
      title={
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Blocks className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-foreground">
                {plugin.name}
              </h2>
              <Badge variant="outline" size="sm">
                v{plugin.version}
              </Badge>
            </div>
            <p className="font-mono text-xs text-muted-foreground">
              {plugin.id}
            </p>
          </div>
        </div>
      }
      footer={
        <div className="flex w-full items-center justify-between gap-3 border-t border-border/40 pt-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {isAdmin ? (
              <span className="flex items-center gap-1 text-emerald-500 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5" /> Admin Access
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-500 font-medium">
                <Lock className="h-3.5 w-3.5" /> Read-Only Mode
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleSave}
              disabled={
                !isAdmin ||
                isSaving ||
                (editorMode === 'json' && Boolean(jsonError))
              }
              className="gap-1.5"
            >
              <Save className="h-3.5 w-3.5" />
              {isSaving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-6 px-1 py-2">
        {/* Accordion Sections */}
        <Accordion type="multiple" defaultValue={['config', 'hooks', 'routes']}>
          {/* Section 1: Configuration & Secrets */}
          <AccordionItem value="config" className="border-border/60">
            <AccordionTrigger className="py-3 text-sm font-semibold hover:no-underline">
              <div className="flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-primary" />
                <span>Plugin Configuration & Secrets</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-1">
                {/* Editor Mode Switcher */}
                <div className="flex items-center justify-between border-b border-border/40 pb-2">
                  <span className="text-xs text-muted-foreground">
                    Configure environment variables, API tokens, and options.
                  </span>
                  <div className="flex items-center gap-1 rounded-lg border bg-muted/40 p-0.5">
                    <button
                      type="button"
                      onClick={switchToFormMode}
                      className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                        editorMode === 'form'
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Code2 className="h-3.5 w-3.5" />
                      Key-Value
                    </button>
                    <button
                      type="button"
                      onClick={switchToJsonMode}
                      className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                        editorMode === 'json'
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <FileJson className="h-3.5 w-3.5" />
                      JSON
                    </button>
                  </div>
                </div>

                {/* Form Mode */}
                {editorMode === 'form' ? (
                  <div className="space-y-3">
                    {entries.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-border/60 p-6 text-center">
                        <KeyRound className="mx-auto h-8 w-8 text-muted-foreground/60 mb-2" />
                        <p className="text-xs font-medium text-foreground">
                          No configuration parameters set.
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Add key-value properties below to configure this
                          plugin.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {entries.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 rounded-lg border border-border/40 bg-muted/20 p-2"
                          >
                            <div className="w-2/5">
                              <Input
                                placeholder="KEY_NAME"
                                variant="default"
                                value={item.key}
                                disabled={!isAdmin}
                                onChange={(val: string) =>
                                  handleEntryChange(idx, 'key', val)
                                }
                                className="h-8 font-mono text-xs uppercase"
                              />
                            </div>
                            <div className="relative flex-1">
                              <Input
                                placeholder="value"
                                variant="default"
                                type={
                                  item.isSecret && !revealedSecrets[idx]
                                    ? 'password'
                                    : 'text'
                                }
                                value={item.value}
                                disabled={!isAdmin}
                                onChange={(val: string) =>
                                  handleEntryChange(idx, 'value', val)
                                }
                                className="h-8 text-xs pr-8"
                              />
                              {item.isSecret && (
                                <button
                                  type="button"
                                  onClick={() => handleToggleSecretReveal(idx)}
                                  className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
                                  title={
                                    revealedSecrets[idx] ? 'Hide' : 'Reveal'
                                  }
                                >
                                  {revealedSecrets[idx] ? (
                                    <EyeOff className="h-3.5 w-3.5" />
                                  ) : (
                                    <Eye className="h-3.5 w-3.5" />
                                  )}
                                </button>
                              )}
                            </div>
                            {isAdmin && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveEntry(idx)}
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                title="Delete setting"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {isAdmin && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleAddEntry}
                        className="w-full gap-1.5 border-dashed text-xs"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add Setting
                      </Button>
                    )}
                  </div>
                ) : (
                  /* JSON Mode */
                  <div className="space-y-2">
                    <textarea
                      value={jsonText}
                      disabled={!isAdmin}
                      onChange={(e) => handleJsonChange(e.target.value)}
                      rows={8}
                      className="w-full rounded-lg border border-border bg-muted/30 p-3 font-mono text-xs leading-relaxed focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
                      placeholder="Enter JSON configuration..."
                    />
                    {jsonError && (
                      <p className="flex items-center gap-1 font-mono text-[11px] text-destructive">
                        <AlertTriangle className="h-3 w-3" />
                        {jsonError}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Section 2: Lifecycle Hooks */}
          <AccordionItem value="hooks" className="border-border/60">
            <AccordionTrigger className="py-3 text-sm font-semibold hover:no-underline">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-purple-400" />
                <span>
                  Subscribed Lifecycle Hooks ({plugin.hooks?.length ?? 0})
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pt-1">
                <p className="text-xs text-muted-foreground">
                  Lifecycle hooks allow this plugin to execute automated logic
                  in the background when content is created, modified, or
                  published.
                </p>
                {!plugin.hooks || plugin.hooks.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic py-1">
                    No lifecycle hooks registered by this plugin.
                  </p>
                ) : (
                  <div className="grid gap-2">
                    {plugin.hooks.map((hook) => (
                      <div
                        key={hook}
                        className="space-y-1 rounded-lg border border-border/40 bg-muted/20 p-2.5 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-semibold text-emerald-400">
                            {hook}
                          </span>
                          <Badge
                            variant="purple"
                            size="sm"
                            className="font-mono text-[10px]"
                          >
                            Hook Trigger
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-normal">
                          {HOOK_DESCRIPTIONS[hook] ||
                            'Custom lifecycle hook attached by this plugin.'}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Section 3: Exposed Custom Endpoints */}
          <AccordionItem value="routes" className="border-border/60">
            <AccordionTrigger className="py-3 text-sm font-semibold hover:no-underline">
              <div className="flex items-center gap-2">
                <Network className="h-4 w-4 text-sky-400" />
                <span>Exposed API Routes ({plugin.routes?.length ?? 0})</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pt-1">
                <p className="text-xs text-muted-foreground">
                  Custom HTTP endpoints provided by this plugin. External
                  clients and frontend applications can call these routes
                  directly.
                </p>
                {!plugin.routes || plugin.routes.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic py-1">
                    No custom HTTP routes exposed by this plugin.
                  </p>
                ) : (
                  <div className="grid gap-2">
                    {plugin.routes.map((route, i) => (
                      <div
                        key={`${route.method}-${route.path}-${i}`}
                        className="flex items-center justify-between gap-2 rounded-lg border border-border/40 bg-muted/20 p-2.5 text-xs font-mono"
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <span
                            className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${
                              route.method.toUpperCase() === 'GET'
                                ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                                : route.method.toUpperCase() === 'POST'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : route.method.toUpperCase() === 'PUT'
                                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                    : route.method.toUpperCase() === 'DELETE'
                                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                      : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                            }`}
                          >
                            {route.method.toUpperCase()}
                          </span>
                          <span className="truncate text-foreground/90">
                            {route.path}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(route.path);
                            toast.success('Route path copied to clipboard');
                          }}
                          className="h-7 w-7 p-0 shrink-0 text-muted-foreground hover:text-foreground"
                          title="Copy route path"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </Drawer>
  );
}
