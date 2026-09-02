'use client';

import { Bot } from 'lucide-react';
import { UnderImplementation } from '@/components/common/under-implementation';

export function AgentsView() {
  return (
    <UnderImplementation
      icon={Bot}
      featureName="AUTONOMOUS AGENTS"
      badgeText="Under Active Development"
      description="Autonomous AI agents for automated content drafting, SEO optimization, and intelligent schema assistance are currently under active implementation."
    />
  );
}
