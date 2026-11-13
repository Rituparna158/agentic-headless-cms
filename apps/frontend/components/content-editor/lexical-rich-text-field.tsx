'use client';

import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';

import {
  type EditorState,
  type LexicalEditor,
  FORMAT_TEXT_COMMAND,
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
  $getRoot,
  $createTextNode,
} from 'lexical';
import {
  HeadingNode,
  QuoteNode,
  $createHeadingNode,
  type HeadingTagType,
} from '@lexical/rich-text';
import {
  ListNode,
  ListItemNode,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
} from '@lexical/list';
import { LinkNode, AutoLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link';
import { $setBlocksType } from '@lexical/selection';

import {
  Bold,
  Italic,
  Underline,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Link2,
  Pilcrow,
} from 'lucide-react';
import * as React from 'react';
import { useEffect } from 'react';
import type { LexicalRichTextFieldProps } from '@/types/component.types';

import { Button } from '@repo/shared-ui';
import { cn } from '@/lib/utils';

function ValueSyncPlugin({ value }: { value?: string }) {
  const [editor] = useLexicalComposerContext();
  const lastSerializedRef = React.useRef(value);

  useEffect(() => {
    if (value === undefined) return;
    if (value === lastSerializedRef.current) return;

    editor.getEditorState().read(() => {
      const current = JSON.stringify(editor.getEditorState().toJSON());
      if (current !== value) {
        lastSerializedRef.current = value;
        if (!value || value.trim() === '') {
          editor.update(() => {
            const root = $getRoot();
            root.clear();
            const p = $createParagraphNode();
            root.append(p);
          });
          return;
        }

        try {
          const parsed = editor.parseEditorState(value);
          editor.setEditorState(parsed);
        } catch {
          editor.update(() => {
            const root = $getRoot();
            root.clear();
            const p = $createParagraphNode();
            p.append($createTextNode(value));
            root.append(p);
          });
        }
      }
    });
  }, [editor, value]);

  return null;
}

function EditablePlugin({ disabled }: { disabled?: boolean }) {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    editor.setEditable(!disabled);
  }, [editor, disabled]);
  return null;
}

function Toolbar({ disabled }: { disabled?: boolean }) {
  const [editor] = useLexicalComposerContext();

  function formatHeading(tag: HeadingTagType) {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createHeadingNode(tag));
      }
    });
  }

  function formatParagraph() {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createParagraphNode());
      }
    });
  }

  function handleLink() {
    const url = window.prompt('Enter URL (e.g. https://example.com):');
    if (url === null) return;
    if (url.trim() === '') {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    } else {
      const normalized =
        url.startsWith('http://') ||
        url.startsWith('https://') ||
        url.startsWith('mailto:')
          ? url
          : `https://${url}`;
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, normalized);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1 border-b bg-muted/20 p-1.5 w-full min-w-0">
      {/* Inline text formatting */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-7"
        disabled={disabled}
        aria-label="Bold"
        title="Bold (Ctrl+B)"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')}
      >
        <Bold className="size-3.5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-7"
        disabled={disabled}
        aria-label="Italic"
        title="Italic (Ctrl+I)"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')}
      >
        <Italic className="size-3.5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-7"
        disabled={disabled}
        aria-label="Underline"
        title="Underline (Ctrl+U)"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')}
      >
        <Underline className="size-3.5" />
      </Button>

      <div className="h-4 w-px bg-border mx-0.5" />

      {/* Block formatting: Paragraph, H1, H2 */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-7"
        disabled={disabled}
        aria-label="Paragraph"
        title="Normal text"
        onClick={formatParagraph}
      >
        <Pilcrow className="size-3.5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-7"
        disabled={disabled}
        aria-label="Heading 1"
        title="Heading 1"
        onClick={() => formatHeading('h1')}
      >
        <Heading1 className="size-3.5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-7"
        disabled={disabled}
        aria-label="Heading 2"
        title="Heading 2"
        onClick={() => formatHeading('h2')}
      >
        <Heading2 className="size-3.5" />
      </Button>

      <div className="h-4 w-px bg-border mx-0.5" />

      {/* Lists */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-7"
        disabled={disabled}
        aria-label="Bullet List"
        title="Bullet list"
        onClick={() =>
          editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)
        }
      >
        <List className="size-3.5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-7"
        disabled={disabled}
        aria-label="Numbered List"
        title="Numbered list"
        onClick={() =>
          editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)
        }
      >
        <ListOrdered className="size-3.5" />
      </Button>

      <div className="h-4 w-px bg-border mx-0.5" />

      {/* Links */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-7"
        disabled={disabled}
        aria-label="Insert Link"
        title="Insert or edit link"
        onClick={handleLink}
      >
        <Link2 className="size-3.5" />
      </Button>
    </div>
  );
}

function onError(error: Error) {
  console.error('Lexical editor error:', error);
}

const EDITOR_NODES = [
  HeadingNode,
  QuoteNode,
  ListNode,
  ListItemNode,
  LinkNode,
  AutoLinkNode,
];

const EDITOR_THEME = {
  paragraph: 'mb-2 leading-relaxed',
  heading: {
    h1: 'text-2xl font-bold mb-2 mt-3',
    h2: 'text-xl font-semibold mb-2 mt-2.5',
  },
  list: {
    ul: 'list-disc list-inside mb-2 pl-2 space-y-0.5',
    ol: 'list-decimal list-inside mb-2 pl-2 space-y-0.5',
    listitem: 'leading-relaxed',
  },
  link: 'text-primary underline font-medium hover:text-primary/80 cursor-pointer',
  text: {
    bold: 'font-bold',
    italic: 'italic',
    underline: 'underline',
  },
};

export function LexicalRichTextField({
  value,
  onChange,
  placeholder,
  disabled,
  id,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
}: LexicalRichTextFieldProps) {
  const getInitialEditorState = React.useCallback(
    (editor: LexicalEditor) => {
      if (!value || !value.trim()) return;
      try {
        const parsed = editor.parseEditorState(value);
        editor.setEditorState(parsed);
      } catch {
        editor.update(() => {
          const root = $getRoot();
          root.clear();
          const p = $createParagraphNode();
          p.append($createTextNode(value));
          root.append(p);
        });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <LexicalComposer
      initialConfig={{
        namespace: 'content-editor',
        theme: EDITOR_THEME,
        nodes: EDITOR_NODES,
        editable: !disabled,
        onError,
        editorState: getInitialEditorState,
      }}
    >
      <div
        className={cn(
          'rounded-md border bg-background overflow-hidden w-full min-w-0',
          disabled &&
            'opacity-60 pointer-events-none cursor-not-allowed select-none',
        )}
      >
        <Toolbar disabled={disabled} />
        <div className="relative">
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                id={id}
                aria-describedby={ariaDescribedBy}
                aria-invalid={ariaInvalid}
                className="min-h-32 p-3 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            }
            placeholder={
              <div className="text-muted-foreground pointer-events-none absolute top-3 left-3 text-sm">
                {placeholder}
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <ListPlugin />
          <LinkPlugin />
          <HistoryPlugin />
          <EditablePlugin disabled={disabled} />
          <ValueSyncPlugin value={value} />
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
