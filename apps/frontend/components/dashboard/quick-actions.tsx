import Link from 'next/link';
import { Button } from '@repo/shared-ui';
import { FilePlus2, Layers, Upload } from 'lucide-react';

/**
 * QuickActions provides direct shortcut buttons to the primary content
 * management creation workflows. Kept accessible and compact in the header.
 */
export function QuickActions() {
  return (
    <div className="flex items-center flex-wrap gap-2 w-full sm:w-auto min-w-0">
      <Button
        asChild
        size="sm"
        className="h-8 gap-1.5 text-xs font-medium shadow-xs"
      >
        <Link href="/content">
          <FilePlus2 className="size-3.5" />
          <span>+ New Entry</span>
        </Link>
      </Button>

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
    </div>
  );
}
