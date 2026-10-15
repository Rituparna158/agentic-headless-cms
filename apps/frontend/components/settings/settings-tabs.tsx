'use client';

import { useState } from 'react';
import { Tabs } from '@repo/shared-ui';
import { GeneralSettingsTab } from '@/components/settings/general-settings-tab';
import { LocalesTab } from '@/components/settings/locales-tab';
import { SecurityTab } from '@/components/settings/security-tab';
import { PluginsTab } from '@/components/settings/plugins/plugins-tab';

export function SettingsTabs({
  defaultTab = 'system-info',
}: {
  defaultTab?: string;
}) {
  const tabs = [
    { label: 'System Info', id: 'system-info' },
    { label: 'Locales', id: 'locales' },
    { label: 'Security', id: 'security' },
    { label: 'Plugins', id: 'plugins' },
  ];
  const [activeTab, setActiveTab] = useState(defaultTab);
  const activeIndex = Math.max(
    0,
    tabs.findIndex((t) => t.id === activeTab),
  );

  return (
    <div className="space-y-4">
      <Tabs
        options={tabs.map((t) => t.label)}
        selected={activeIndex}
        value={(idx: number) => {
          if (tabs[idx]) setActiveTab(tabs[idx].id);
        }}
      />
      {activeTab === 'system-info' && (
        <div className="space-y-4">
          <GeneralSettingsTab />
        </div>
      )}
      {activeTab === 'locales' && (
        <div className="space-y-4">
          <LocalesTab />
        </div>
      )}
      {activeTab === 'security' && (
        <div className="space-y-4">
          <SecurityTab />
        </div>
      )}
      {activeTab === 'plugins' && (
        <div className="space-y-4">
          <PluginsTab />
        </div>
      )}
    </div>
  );
}
