import React, { createContext, useContext, useMemo } from 'react';
import { createClient, AgenticCmsClient } from '@repo/sdk-core';

import type { CmsProviderProps } from './types.js';

export const CmsContext = createContext<AgenticCmsClient<
  Record<string, unknown>
> | null>(null);

export function CmsProvider({ baseUrl, apiToken, children }: CmsProviderProps) {
  const client = useMemo(() => {
    return createClient({
      baseUrl: baseUrl || '',
      apiToken,
    });
  }, [baseUrl, apiToken]);

  return (
    <CmsContext.Provider
      value={client as unknown as AgenticCmsClient<Record<string, unknown>>}
    >
      {children}
    </CmsContext.Provider>
  );
}

export function useCmsClient<
  TMap extends Record<string, unknown> = Record<string, unknown>,
>(): AgenticCmsClient<TMap> {
  const ctx = useContext(CmsContext);
  if (!ctx) {
    throw new Error('useCmsClient must be used within a CmsProvider');
  }
  return ctx as unknown as AgenticCmsClient<TMap>;
}
