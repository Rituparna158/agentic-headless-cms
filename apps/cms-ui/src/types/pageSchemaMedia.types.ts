export interface SchemaMediaFieldProps {
  value: string;
  fieldApiId?: string;
  fieldDisplayName?: string;
  onChange: (url: string) => void;
  onOpenMediaPicker: () => void;
}

export interface SchemaRichTextEditorProps {
  value: string;
  fieldApiId?: string;
  fieldDisplayName?: string;
  onChange: (value: string) => void;
}
