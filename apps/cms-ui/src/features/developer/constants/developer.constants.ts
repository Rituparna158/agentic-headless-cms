import React from 'react';
import {
  Type,
  FileText,
  AlignLeft,
  Hash,
  ToggleLeft,
  Image as ImageIcon,
  Link2,
  ListFilter,
} from 'lucide-react';
import type { DynamicFieldDataType } from '@/types/content.types';

export const FIELD_TYPE_OPTIONS: Array<{
  type: DynamicFieldDataType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { type: 'text', label: 'Text Input', icon: Type },
  { type: 'textarea', label: 'Textarea', icon: AlignLeft },
  { type: 'richtext', label: 'Rich Text', icon: FileText },
  { type: 'number', label: 'Numeric Value', icon: Hash },
  { type: 'boolean', label: 'Toggle Switch', icon: ToggleLeft },
  { type: 'media', label: 'Media Picker', icon: ImageIcon },
  { type: 'url', label: 'URL Link', icon: Link2 },
  { type: 'select', label: 'Select Choices', icon: ListFilter },
];
