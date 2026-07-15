import type { Metadata } from 'next';
import Link from 'next/link';
import { PlusIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SchemaList } from '@/components/schema-builder/schema-list';

export const metadata: Metadata = {
  title: 'Content Types — Agentic CMS',
};

export default function ContentTypesPage() {
  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Content Types</h1>
        <Button asChild>
          <Link href="/content-types/new">
            <PlusIcon className="size-4" />
            New content type
          </Link>
        </Button>
      </div>

      <SchemaList />
    </div>
  );
}
