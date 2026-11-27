'use client';

import Link from 'next/link';
import { Button } from '@repo/shared-ui';
import { FileText, Layers, Upload } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';

/**
 * QuickActions provides direct shortcut buttons to the primary content
 * management workflows. Kept accessible and compact in the header.
 */
export function QuickActions() {
  const user = useAuthStore((state) => state.user);
  const isAdmin =
    user?.roles?.some((role) =>
      ['admin', 'super_admin'].includes(role.toLowerCase()),
    ) || false;
  const canCreateSchema = isAdmin;
  const canUploadMedia =
    isAdmin ||
    user?.roles?.some((role) =>
      ['editor', 'author'].includes(role.toLowerCase()),
    ) ||
    (user?.permissions?.some((p) =>
      ['*', 'manage_media', 'create'].includes(p.action),
    ) ??
      false);

  return (
    <div className="flex items-center flex-wrap gap-2 w-full sm:w-auto min-w-0">
      <Button
        asChild
        size="sm"
        className="h-8 gap-1.5 text-xs font-medium shadow-xs"
      >
        <Link href="/content">
          <FileText className="size-3.5" />
          <span>Manage Content</span>
        </Link>
      </Button>

      {canCreateSchema && (
        <Button
          asChild
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs font-medium border-border/80"
        >
          <Link href="/content-types/new">
            <Layers className="size-3.5 text-muted-foreground" />
            <span>+ New Content Type</span>
          </Link>
        </Button>
      )}

      {canUploadMedia && (
        <Button
          asChild
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs font-medium border-border/80"
        >
          <Link href="/media">
            <Upload className="size-3.5 text-muted-foreground" />
            <span>Upload Media</span>
          </Link>
        </Button>
      )}
    </div>
  );
}
