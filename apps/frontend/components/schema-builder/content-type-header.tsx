'use client';

import Link from 'next/link';
import { PlusIcon, Boxes } from 'lucide-react';
import { Button, Badge } from '@repo/shared-ui';
import { useAuthStore } from '@/stores/auth-store';

export function ContentTypeHeader() {
  const user = useAuthStore((state) => state.user);
  const isAdmin =
    user?.roles?.some((role) =>
      ['admin', 'super_admin'].includes(role.toLowerCase()),
    ) || false;

  const canCreate =
    isAdmin ||
    user?.permissions?.some(
      (p) =>
        (p.schemaId === null || p.schemaId === '*') &&
        ['create', '*'].includes(p.action),
    );

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border/50">
      <div>
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Boxes className="size-4" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Content Type Builder
          </h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Design, organize, and manage content models and data structures.
        </p>
      </div>
      {canCreate ? (
        <Button asChild size="sm" className="h-9 px-3.5 shadow-xs shrink-0">
          <Link href="/content-types/new">
            <PlusIcon className="size-4 mr-1.5" />
            New Type
          </Link>
        </Button>
      ) : (
        <Badge
          variant="outline"
          className="text-muted-foreground py-1 px-3 shrink-0"
        >
          Read-only Access
        </Badge>
      )}
    </div>
  );
}
