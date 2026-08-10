'use client';

import { useState } from 'react';
import { Tabs } from '@repo/shared-ui';
import { GeneralSettingsTab } from '@/components/settings/general-settings-tab';
import { LocalesTab } from '@/components/settings/locales-tab';
import { SecurityTab } from '@/components/settings/security-tab';

export function SettingsTabs() {
  const tabs = [
    { label: 'General', id: 'general' },
    { label: 'Locales', id: 'locales' },
    { label: 'Security', id: 'security' },
  ];
  const [activeTab, setActiveTab] = useState('general');
  const activeIndex = tabs.findIndex((t) => t.id === activeTab);

  return (
    <div className="space-y-4">
      <Tabs
        options={tabs.map((t) => t.label)}
        selected={activeIndex}
        value={(idx) => {
          if (tabs[idx]) setActiveTab(tabs[idx].id);
        }}
      />
      {activeTab === 'general' && (
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
    </div>
  );
}
