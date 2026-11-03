import type React from 'react';
import type { ClientConfig } from '@mindfiredigital/sdk-core';

export interface CmsProviderProps extends Partial<ClientConfig> {
  children: React.ReactNode;
}
