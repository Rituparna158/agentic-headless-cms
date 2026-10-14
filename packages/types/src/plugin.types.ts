export interface PluginRecord {
  id: string;
  name: string;
  version: string;
  isEnabled: boolean;
  config: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpsertPluginInput {
  id: string;
  name: string;
  version: string;
  isEnabled?: boolean;
  config?: Record<string, unknown>;
}

export interface UpdatePluginStatusInput {
  isEnabled: boolean;
}

export interface UpdatePluginConfigInput {
  config: Record<string, unknown>;
}
