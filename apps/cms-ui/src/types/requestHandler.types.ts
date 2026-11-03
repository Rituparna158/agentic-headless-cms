import { AxiosRequestConfig } from 'axios';
import { z } from 'zod';

export interface RequestConfig<T = unknown> extends AxiosRequestConfig {
  schema?: z.ZodType<T>;
  endpointLabel?: string;
}
