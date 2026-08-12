'use client';

import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { type EditorState, FORMAT_TEXT_COMMAND } from 'lexical';
import { Bold, Italic, Underline } from 'lucide-react';
import type * as React from 'react';
import type { LexicalRichTextFieldProps } from '@/types/component.types';

import { Button } from '@repo/shared-ui';
import { cn } from '@/lib/utils';

function Toolbar({ disabled }: { disabled?: boolean }) {
  const [editor] = useLexicalComposerContext();

  return (
    <div className="flex gap-1 border-b p-1">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={disabled}
        aria-label="Bold"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')}
      >
        <Bold className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={disabled}
        aria-label="Italic"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')}
      >
        <Italic className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={disabled}
        aria-label="Underline"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')}
      >
        <Underline className="size-4" />
      </Button>
    </div>
  );
}

function onError(error: Error) {
  console.error('Lexical editor error:', error);
}

export function LexicalRichTextField({
  value,
  onChange,
  placeholder,
  disabled,
  id,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
}: LexicalRichTextFieldProps) {
  return (
    <LexicalComposer
      initialConfig={{
        namespace: 'content-editor',
        editable: !disabled,
        onError,
        editorState: value || undefined,
      }}
    >
      <div className={cn('rounded-md border', disabled && 'opacity-50')}>
        <Toolbar disabled={disabled} />
        <div className="relative">
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                id={id}
                aria-describedby={ariaDescribedBy}
                aria-invalid={ariaInvalid}
                className="min-h-32 p-3 text-sm outline-none"
              />
            }
            placeholder={
              <div className="text-muted-foreground pointer-events-none absolute top-3 left-3 text-sm">
                {placeholder}
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <OnChangePlugin
            onChange={(editorState: EditorState) =>
              onChange(JSON.stringify(editorState.toJSON()))
            }
          />
        </div>
      </div>
    </LexicalComposer>
  );
}
