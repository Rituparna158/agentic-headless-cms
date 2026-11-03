export interface CreateLocaleInput {
  code: string;
  name: string;
  isDefault?: boolean;
}

export interface LocaleRecord {
  id: string;
  code: string;
  name: string;
  isDefault: boolean;
  createdAt: string;
}
