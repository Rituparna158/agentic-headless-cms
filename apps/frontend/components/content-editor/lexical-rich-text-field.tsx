'use client';

import type * as React from 'react';
import { FORMAT_TEXT_COMMAND, type EditorState } from 'lexical';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { Bold, Italic, Underline } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface LexicalRichTextFieldProps {
  /**
   * Serialized Lexical editor state (JSON string), or empty for a blank
   * editor — read only once, at mount, to seed `initialConfig.editorState`.
   * This is deliberately *not* a fully controlled value: re-parsing and
   * replacing the editor's state on every `value` change (e.g. reactively
   * syncing it back in an effect) fights Lexical's own reconciler, since
   * `onChange` below already updates `value` on every keystroke — the two
   * together create a feedback loop that visibly duplicates/corrupts text
   * as you type. Switching to a different entry happens through Next.js
   * navigation (a different route param unmounts and remounts this whole
   * form), which already re-seeds a fresh editor with the new initial
   * value, so no imperative re-sync is needed.
   */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  'aria-describedby'?: React.AriaAttributes['aria-describedby'];
  'aria-invalid'?: React.AriaAttributes['aria-invalid'];
}

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
