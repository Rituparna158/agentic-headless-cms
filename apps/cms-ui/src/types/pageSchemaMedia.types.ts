export interface SchemaMediaFieldProps {
  value: string;
  fieldApiId?: string;
  fieldDisplayName?: string;
  onChange: (url: string) => void;
  onOpenMediaPicker: () => void;
  /** 'light' restyles the field for light surfaces such as the page and article editors. */
  tone?: 'dark' | 'light';
}

export interface SchemaRichTextEditorProps {
  value: string;
  fieldApiId?: string;
  fieldDisplayName?: string;
  onChange: (value: string) => void;
  /** 'paper' renders a light, toolbar-free writing surface with a `/` command menu. */
  variant?: 'default' | 'field' | 'article';
}
