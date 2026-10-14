export interface GrapesJSData {
  builder: 'grapesjs';
  projectData?: Record<string, unknown>; // Replaces html, css, components, styles for better serialization
  // We keep these for backwards compatibility if needed during transition, but projectData is preferred
  html?: string;
  css?: string;
  components?: unknown;
  styles?: unknown;
}

export interface GrapesJSEditorProps {
  initialData?: Partial<GrapesJSData>;
  onChange: (data: GrapesJSData) => void;
  brandTitle?: string;
}
