import type { Metadata } from 'next';
import { SettingsTabs } from '@/components/settings/settings-tabs';

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

      <SettingsTabs />
    </div>
  );
}
