import type { Editor } from 'grapesjs';
import type {
  TemplateValidationResult,
  ImportActionChoice,
} from '../../types/template.types';
import type {
  GrapesJSData,
  CmsSchemaField,
  GrapesJSEditorProps,
} from '../../types/collections.types';

export type { GrapesJSData, GrapesJSEditorProps };
export type SchemaFieldOption = CmsSchemaField;

export interface GrapesJSEditorHandle {
  loadTemplate: (
    result: TemplateValidationResult,
    action: ImportActionChoice,
  ) => void;
  loadRawData: (data: Partial<GrapesJSData>) => void;
  isCanvasEmpty: () => boolean;
  getEditor: () => Editor | null;
}
