'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
} from '@repo/shared-ui';
import {
  Server,
  Globe,
  Database,
  ShieldCheck,
  HardDrive,
  Cpu,
  Layers,
  Copy,
  Check,
} from 'lucide-react';
import { API_BASE_URL } from '@/lib/api-client';

export function GeneralSettingsTab() {
  const [copiedEndpoint, setCopiedEndpoint] = React.useState<string | null>(
    null,
  );
  const appId = process.env.NEXT_PUBLIC_APP_ID || 'HEADLESS_CMS';
  const nodeEnv = process.env.NODE_ENV || 'production';
  const appVersion =
    process.env.NEXT_PUBLIC_APP_VERSION ||
    process.env.NEXT_PUBLIC_VERSION ||
    'v1.0.0';

  const copyToClipboard = (text: string, id: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedEndpoint(id);
    setTimeout(() => setCopiedEndpoint(null), 2000);
  };

  const rawTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const canonicalTimezone =
    rawTimezone === 'Asia/Calcutta' ? 'Asia/Kolkata' : rawTimezone;

  return (
    <div className="space-y-6">
      {/* Instance Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl flex items-center gap-2">
                <Server className="size-5 text-primary" />
                Instance Overview
              </CardTitle>
              <CardDescription>
                System health, deployment environment, and platform metadata.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border p-3.5 bg-muted/20">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                Application ID
              </p>
              <p className="text-sm font-semibold mt-1 font-mono">{appId}</p>
            </div>
            <div className="rounded-lg border p-3.5 bg-muted/20">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                Environment
              </p>
              <p className="text-sm font-semibold mt-1 capitalize font-mono">
                {nodeEnv}
              </p>
            </div>
            <div className="rounded-lg border p-3.5 bg-muted/20">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                Version
              </p>
              <p className="text-sm font-semibold mt-1 font-mono">
                {appVersion}
              </p>
            </div>
            <div className="rounded-lg border p-3.5 bg-muted/20">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                Architecture
              </p>
              <p className="text-sm font-semibold mt-1">Decoupled Headless</p>
            </div>
            <div className="rounded-lg border p-3.5 bg-muted/20">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                Default Locale
              </p>
              <p className="text-sm font-semibold mt-1 font-mono">
                en (English)
              </p>
            </div>
            <div className="rounded-lg border p-3.5 bg-muted/20">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                Timezone
              </p>
              <p className="text-sm font-semibold mt-1">{canonicalTimezone}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API & Delivery Endpoints */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Globe className="size-5 text-primary" />
            API & Content Delivery
          </CardTitle>
          <CardDescription>
            Configured endpoints for consuming published content across frontend
            applications.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-lg border bg-muted/20 gap-2">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">REST Delivery API</p>
              <p className="text-xs text-muted-foreground">
                RESTful endpoint for schema validation, draft management, and
                content queries.
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <code className="text-xs bg-muted px-2.5 py-1 rounded font-mono border">
                {API_BASE_URL}/api/v1/content
              </code>
              <button
                type="button"
                onClick={() =>
                  copyToClipboard(
                    `${API_BASE_URL}/api/v1/content`,
                    'rest-endpoint',
                  )
                }
                className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer border border-border/50"
                title="Copy REST endpoint"
                aria-label="Copy REST endpoint"
              >
                {copiedEndpoint === 'rest-endpoint' ? (
                  <Check className="size-3.5 text-emerald-500" />
                ) : (
                  <Copy className="size-3.5" />
                )}
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-lg border bg-muted/20 gap-2">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">GraphQL Delivery API</p>
              <p className="text-xs text-muted-foreground">
                Dynamic GraphQL endpoint for querying compiled schemas and
                content relations.
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <code className="text-xs bg-muted px-2.5 py-1 rounded font-mono border">
                {API_BASE_URL}/graphql
              </code>
              <button
                type="button"
                onClick={() =>
                  copyToClipboard(`${API_BASE_URL}/graphql`, 'graphql-endpoint')
                }
                className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer border border-border/50"
                title="Copy GraphQL endpoint"
                aria-label="Copy GraphQL endpoint"
              >
                {copiedEndpoint === 'graphql-endpoint' ? (
                  <Check className="size-3.5 text-emerald-500" />
                ) : (
                  <Copy className="size-3.5" />
                )}
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-lg border bg-muted/20 gap-2">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Storage Provider</p>
              <p className="text-xs text-muted-foreground">
                Active media asset storage adapter for media library uploads.
              </p>
            </div>
            <Badge variant="secondary" size="sm" className="font-mono">
              Local File Storage
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* System & Engine Stack */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Layers className="size-5 text-primary" />
            Core Technology Stack
          </CardTitle>
          <CardDescription>
            Production-grade foundations powering this headless CMS
            installation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-start gap-3 p-3 rounded-lg border bg-muted/10">
              <Database className="size-5 text-blue-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Database Layer</p>
                <p className="text-xs text-muted-foreground">
                  PostgreSQL with Drizzle ORM, schema migrations, and connection
                  pooling.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg border bg-muted/10">
              <ShieldCheck className="size-5 text-emerald-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Access & Security</p>
                <p className="text-xs text-muted-foreground">
                  Role-based permissions (RBAC), multi-factor authentication
                  (TOTP), and audit logging.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg border bg-muted/10">
              <Cpu className="size-5 text-purple-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Background Processing</p>
                <p className="text-xs text-muted-foreground">
                  Redis queue adapter with BullMQ for asynchronous jobs and
                  webhook delivery.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg border bg-muted/10">
              <HardDrive className="size-5 text-amber-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Content Versioning</p>
                <p className="text-xs text-muted-foreground">
                  Append-only historical version snapshots with instant visual
                  rollback support.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
