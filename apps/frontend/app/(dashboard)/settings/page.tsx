import type { Metadata } from 'next';
import { SettingsTabs } from '@/components/settings/settings-tabs';
import { Settings as SettingsIcon } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Settings — Headless CMS',
};

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6 w-full min-w-0 max-w-full">
      <div>
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <SettingsIcon className="size-4" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Settings
          </h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Configure platform infrastructure, content locales, and security
          policies.
        </p>
      </div>

      <SettingsTabs />
    </div>
  );
}
