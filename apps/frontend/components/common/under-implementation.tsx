'use client';

import * as React from 'react';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { ArrowLeft, Construction } from 'lucide-react';
import {
  MaintenancePage,
  MaintenancePageLogo,
  MaintenancePageHeading,
  MaintenancePageDesc,
  Button,
} from '@repo/shared-ui';

export interface UnderImplementationProps {
  icon?: LucideIcon;
  featureName: string;
  badgeText?: string;
  description: string;
}

export function UnderImplementation({
  icon: Icon = Construction,
  featureName,
  badgeText = 'Under Active Development',
  description,
}: UnderImplementationProps) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center">
      <MaintenancePage
        variant="minimal"
        icon={Icon}
        iconColor="text-primary/30"
        className="min-h-screen w-full flex flex-col items-center justify-center p-6 bg-background"
      >
        <MaintenancePageLogo logo={Icon} companyName={badgeText} />
        <MaintenancePageHeading className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-center">
          {featureName}
        </MaintenancePageHeading>
        <MaintenancePageDesc className="text-center max-w-2xl text-muted-foreground text-base sm:text-lg mt-2">
          {description}
        </MaintenancePageDesc>
        <div className="pt-6">
          <Button asChild size="lg" className="gap-2 shadow-sm">
            <Link href="/">
              <ArrowLeft className="size-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </MaintenancePage>
    </div>
  );
}
