import type { Metadata } from 'next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GeneralSettingsTab } from '@/components/settings/general-settings-tab';
import { LocalesTab } from '@/components/settings/locales-tab';
import { SecurityTab } from '@/components/settings/security-tab';

export const metadata: Metadata = {
  title: 'Settings — Agentic CMS',
};

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Configure global instance settings, content locales, and security.
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="locales">Locales</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>
        <TabsContent value="general" className="space-y-4">
          <GeneralSettingsTab />
        </TabsContent>
        <TabsContent value="locales" className="space-y-4">
          <LocalesTab />
        </TabsContent>
        <TabsContent value="security" className="space-y-4">
          <SecurityTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
