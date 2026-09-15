/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { Settings, Code } from 'lucide-react';
import {
  usePageBuilderStore,
  EMBED_CODE_DEFAULTS,
} from '../stores/pageBuilderStore';

export const EmbedCodeSettings: React.FC<{ targetComponentId: string }> = ({
  targetComponentId,
}) => {
  const settings = usePageBuilderStore(
    (state) => state.embedCode[targetComponentId] ?? EMBED_CODE_DEFAULTS,
  );
  const setEmbedCode = usePageBuilderStore((state) => state.setEmbedCode);

  const handleChange = (field: keyof typeof settings, value: any) => {
    setEmbedCode(targetComponentId, { [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 pb-4 border-b border-border">
        <Settings className="w-5 h-5 text-primary" />
        <h3 className="font-medium text-foreground">Embed Code Settings</h3>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground flex items-center gap-2">
          <Code className="w-4 h-4 text-muted-foreground" />
          Raw HTML / Iframe
        </label>
        <p className="text-xs text-muted-foreground mb-2">
          Paste your custom HTML, iframe, or scripts here. This will be rendered
          exactly as written.
        </p>
        <textarea
          value={settings.htmlContent}
          onChange={(e) => handleChange('htmlContent', e.target.value)}
          className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background text-foreground font-mono whitespace-pre"
          rows={10}
        />
      </div>
    </div>
  );
};
