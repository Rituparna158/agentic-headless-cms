import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function GeneralSettingsTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>General</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        General instance settings will live here as they&apos;re added.
      </CardContent>
    </Card>
  );
}
