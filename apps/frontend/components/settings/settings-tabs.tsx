'use client';

import { useState } from 'react';
import { Tabs } from '@repo/shared-ui';
import { GeneralSettingsTab } from '@/components/settings/general-settings-tab';
import { LocalesTab } from '@/components/settings/locales-tab';
import { SecurityTab } from '@/components/settings/security-tab';
import { WorkflowsList } from '@/components/workflows/workflows-list';

export function SettingsTabs() {
  const tabs = [
    { label: 'System Info', id: 'system-info' },
    { label: 'Locales', id: 'locales' },
    { label: 'Workflows', id: 'workflows' },
    { label: 'Security', id: 'security' },
  ];
  const [activeTab, setActiveTab] = useState('system-info');
  const activeIndex = tabs.findIndex((t) => t.id === activeTab);

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
      {activeTab === 'workflows' && (
        <div className="space-y-4">
          <WorkflowsList />
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
