import type { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SchemaBuilderForm } from '@/components/schema-builder/schema-builder-form';

export const metadata: Metadata = {
  title: 'New Content Type — Agentic CMS',
};

export default function NewContentTypePage() {
  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold">New Content Type</h1>

      <Card>
        <CardHeader>
          <CardTitle>Schema</CardTitle>
        </CardHeader>
        <CardContent>
          <SchemaBuilderForm />
        </CardContent>
      </Card>
    </div>
  );
}
