'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@repo/shared-ui';
import {
  FileText,
  Layers,
  Image as ImageIcon,
  Webhook,
  Shield,
  ExternalLink,
} from 'lucide-react';

export function DashboardResources() {
  const resources = [
    {
      title: 'Content Manager',
      description: 'Manage localized entries and drafts',
      href: '/content',
      icon: FileText,
    },
    {
      title: 'Content Type Builder',
      description: 'Design schemas and relation models',
      href: '/content-types',
      icon: Layers,
    },
    {
      title: 'Media Library',
      description: 'Upload and organize media assets',
      href: '/media',
      icon: ImageIcon,
    },
    {
      title: 'Webhooks & Events',
      description: 'Configure real-time event triggers',
      href: '/webhooks',
      icon: Webhook,
    },
    {
      title: 'Roles & Permissions',
      description: 'Control access policies and tokens',
      href: '/roles-access',
      icon: Shield,
    },
  ];

  return (
    <div className="space-y-4 w-full min-w-0 max-w-full">
      {/* Quick Navigation Card */}
      <Card className="border border-border/70 shadow-xs w-full min-w-0 max-w-full overflow-hidden">
        <CardHeader className="pb-3 w-full min-w-0">
          <h2 className="text-sm font-semibold tracking-tight text-foreground leading-none truncate">
            Platform Modules
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            Quick navigation across system modules.
          </p>
        </CardHeader>
        <CardContent className="p-0 w-full min-w-0 max-w-full">
          <div className="divide-y divide-border/40 w-full min-w-0 max-w-full">
            {resources.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center justify-between p-3 hover:bg-muted/40 transition-colors group w-full min-w-0 max-w-full gap-2.5"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="size-7 rounded-md bg-muted/60 text-muted-foreground group-hover:text-primary transition-colors flex items-center justify-center shrink-0">
                      <Icon className="size-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium text-foreground group-hover:text-primary transition-colors truncate">
                        {item.title}
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        {item.description}
                      </div>
                    </div>
                  </div>
                  <ExternalLink className="size-3 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
