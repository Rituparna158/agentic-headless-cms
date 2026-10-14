import type { Editor } from 'grapesjs';
import type {
  TemplateValidationResult,
  ImportActionChoice,
} from '../../types/template.types';

export interface GrapesJSData {
  builder: 'grapesjs';
  projectData?: Record<string, unknown>; // Replaces html, css, components, styles for better serialization
  html?: string;
  css?: string;
  components?: unknown;
  styles?: unknown;
}

export interface GrapesJSEditorHandle {
  loadTemplate: (
    result: TemplateValidationResult,
    action: ImportActionChoice,
  ) => void;
  loadRawData: (data: Partial<GrapesJSData>) => void;
  isCanvasEmpty: () => boolean;
  getEditor: () => Editor | null;
}

export interface GrapesJSEditorProps {
  initialData?: Partial<GrapesJSData>;
  onChange: (data: GrapesJSData) => void;
  brandTitle?: string;
}
