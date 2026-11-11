import type { Metadata } from 'next';
import { Breadcrumbs } from '@repo/shared-ui';
import { SchemaBuilderForm } from '@/components/schema-builder/schema-builder-form';

export const metadata: Metadata = {
  title: 'New Content Type — Headless CMS',
};

export default function NewContentTypePage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto w-full min-w-0 max-w-full">
      <Breadcrumbs
        variant="text"
        size="sm"
        className="p-0 bg-transparent"
        items={[
          { label: 'Content Type Builder', href: '/content-types' },
          { label: 'New Content Type' },
        ]}
      />

      <div className="pb-2 border-b border-border/50">
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
          New Content Type
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Configure model parameters, attributes, and field validations.
        </p>
      </div>

      <SchemaBuilderForm />
    </div>
  );
}
