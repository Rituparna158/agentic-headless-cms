'use client';

import Link from 'next/link';
import { PlusIcon } from 'lucide-react';
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
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-semibold">Content Type Builder</h1>
      {canCreate ? (
        <Button asChild>
          <Link href="/content-types/new">
            <PlusIcon className="size-4 mr-1.5" />
            New Content Type
          </Link>
        </Button>
      ) : (
        <Badge variant="outline" className="text-muted-foreground py-1 px-3">
          Read-only Access
        </Badge>
      )}
    </div>
  );
}
