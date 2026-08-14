import React, { createContext, useContext, useMemo } from 'react';
import { createClient, AgenticCmsClient } from '@repo/sdk-core';

import type { CmsProviderProps } from './types.js';

export const CmsContext = createContext<AgenticCmsClient | null>(null);

export function CmsProvider({ baseUrl, apiToken, children }: CmsProviderProps) {
  const client = useMemo(() => {
    return createClient({
      baseUrl: baseUrl || '',
      apiToken,
    });
  }, [baseUrl, apiToken]);

  return <CmsContext.Provider value={client}>{children}</CmsContext.Provider>;
}

export function useCmsClient(): AgenticCmsClient {
  const ctx = useContext(CmsContext);
  if (!ctx) {
    throw new Error('useCmsClient must be used within a CmsProvider');
  }
  return ctx;
}
