import type { Metadata } from 'next';
import { SettingsTabs } from '@/components/settings/settings-tabs';

export const metadata: Metadata = {
  title: 'Plugins Settings — Agentic CMS',
  description:
    'Manage installed extensions, inspect registered lifecycle hooks and routes, and update credentials.',
};

export default function PluginsSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Configure global instance settings, content locales, plugins, and
          security.
        </p>
      </div>

      <SettingsTabs defaultTab="plugins" />
    </div>
  );
}
