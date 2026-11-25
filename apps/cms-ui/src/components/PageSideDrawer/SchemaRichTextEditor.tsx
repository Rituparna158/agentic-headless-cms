import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useConfirm } from '@/hooks/useConfirm';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { marked } from 'marked';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  Link2,
  ImageIcon,
  Undo2,
  Redo2,
  UploadCloud,
  FileCode,
  Eye,
  FileText,
  Copy,
  Check,
  CodeXml,
} from 'lucide-react';
import { MediaAssetPickerModal } from '@/features/media/components/MediaAssetPickerModal';
import { getMediaFileUrl } from '@/features/media/utils/media.util';
import type { SchemaRichTextEditorProps } from '@/types/pageSchemaMedia.types';
import { convertHtmlToMarkdown } from '@/utils/covertHtmlToMarkdown';
import type { SlashState, SlashCommand } from './types/schemaRichText.types';
import { filterSlashCommands } from './constants/schemaRichText.constants';

export const SchemaRichTextEditor: React.FC<SchemaRichTextEditorProps> = ({
  value,
  fieldApiId: _fieldApiId,
  fieldDisplayName: _fieldDisplayName = 'Content',
  onChange,
  variant = 'default',
}) => {
  const isPaper = variant !== 'default';
  const isArticle = variant === 'article';
  const confirmAction = useConfirm();
  const [activeTab, setActiveTab] = useState<'visual' | 'markdown' | 'html'>(
    'visual',
  );
  const [rawText, setRawText] = useState(value || '');
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [importNotification, setImportNotification] = useState<string | null>(
    null,
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Slash ("/") command menu state (paper variant only)
  const [slash, setSlash] = useState<SlashState | null>(null);
  const [slashIndex, setSlashIndex] = useState(0);
  const slashRef = useRef<SlashState | null>(null);
  const slashIndexRef = useRef(0);
  const runSlashRef = useRef<(item: SlashCommand) => void>(() => {});
  slashRef.current = slash;
  slashIndexRef.current = slashIndex;

  const syncSlashMenu = (ed: Editor) => {
    if (!isPaper) return;
    const { selection } = ed.state;
    if (!selection.empty) {
      setSlash(null);
      return;
    }
    const { $from } = selection;
    const textBefore = $from.parent.textBetween(
      0,
      $from.parentOffset,
      undefined,
      '\ufffc',
    );
    const match = /(?:^|\s)\/([\w-]*)$/.exec(textBefore);
    if (!match) {
      setSlash(null);
      return;
    }
    const query = match[1] ?? '';
    const coords = ed.view.coordsAtPos($from.pos);
    setSlash({
      query,
      from: $from.pos - query.length - 1,
      top: coords.bottom + 6,
      left: coords.left,
    });
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-indigo-400 underline hover:text-indigo-300',
        },
      }),
      Image.configure({
        inline: true,
        HTMLAttributes: {
          class: 'rounded-xl max-w-full my-3 border border-zinc-800 shadow-md',
        },
      }),
      Placeholder.configure({
        placeholder: isPaper
          ? 'Tell your story freely. Type / for headings, images, quotes and more...'
          : 'Write engaging rich text or drop a Markdown/HTML file here...',
      }),
    ],
    content: value || '',
    editorProps: {
      attributes: {
        class: isPaper
          ? 'prose prose-stone max-w-none focus:outline-none min-h-[60vh] text-[17px] leading-[1.75] text-stone-800 select-text'
          : 'prose prose-invert max-w-none focus:outline-none min-h-[220px] max-h-[500px] overflow-y-auto px-4 py-3 text-sm leading-relaxed text-zinc-200 select-text',
      },
      handleKeyDown: (_view, event) => {
        const current = slashRef.current;
        if (!current) return false;
        const items = filterSlashCommands(current.query);
        if (event.key === 'Escape') {
          setSlash(null);
          return true;
        }
        if (items.length === 0) return false;
        if (event.key === 'ArrowDown') {
          setSlashIndex((slashIndexRef.current + 1) % items.length);
          return true;
        }
        if (event.key === 'ArrowUp') {
          setSlashIndex(
            (slashIndexRef.current - 1 + items.length) % items.length,
          );
          return true;
        }
        if (event.key === 'Enter' || event.key === 'Tab') {
          const item = items[Math.min(slashIndexRef.current, items.length - 1)];
          if (item) runSlashRef.current(item);
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      onChange(html);
      setRawText(html);
      syncSlashMenu(ed);
    },
    onSelectionUpdate: ({ editor: ed }) => syncSlashMenu(ed),
  });

  // Sync external value changes into editor
  useEffect(() => {
    if (editor && value !== undefined && value !== editor.getHTML()) {
      editor.commands.setContent(value || '');
      setRawText(value || '');
    }
  }, [value, editor]);

  // Handle switching between Visual, Markdown, and HTML modes
  const handleTabChange = (nextTab: 'visual' | 'markdown' | 'html') => {
    if (nextTab === activeTab) return;

    if (activeTab === 'visual') {
      const currentHtml = editor ? editor.getHTML() : value;
      if (nextTab === 'markdown') {
        setRawText(convertHtmlToMarkdown(currentHtml));
      } else if (nextTab === 'html') {
        setRawText(currentHtml);
      }
    } else if (activeTab === 'markdown') {
      const parsedHtml = (marked.parse(rawText) as string) || '';
      onChange(parsedHtml);
      if (nextTab === 'visual' && editor) {
        editor.commands.setContent(parsedHtml);
      } else if (nextTab === 'html') {
        setRawText(parsedHtml);
      }
    } else if (activeTab === 'html') {
      onChange(rawText);
      if (nextTab === 'visual' && editor) {
        editor.commands.setContent(rawText);
      } else if (nextTab === 'markdown') {
        setRawText(convertHtmlToMarkdown(rawText));
      }
    }

    setActiveTab(nextTab);
  };

  // Process uploaded or dropped Markdown/HTML files
  const processUploadedFile = (file: File) => {
    const reader = new FileReader();
    const isMarkdown =
      file.name.endsWith('.md') ||
      file.name.endsWith('.markdown') ||
      file.type === 'text/markdown';

    reader.onload = (e) => {
      const content = String(e.target?.result || '');
      let finalHtml = content;

      if (isMarkdown) {
        finalHtml = (marked.parse(content) as string) || '';
      }

      onChange(finalHtml);
      if (editor) {
        editor.commands.setContent(finalHtml);
      }
      setRawText(activeTab === 'markdown' ? content : finalHtml);

      setImportNotification(
        `Imported "${file.name}" (${file.size} bytes) successfully!`,
      );
      setTimeout(() => setImportNotification(null), 3500);
    };

    reader.readAsText(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processUploadedFile(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Drag-and-drop file support
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    const file = e.dataTransfer.files?.[0];
    if (
      file &&
      (file.name.endsWith('.md') ||
        file.name.endsWith('.markdown') ||
        file.name.endsWith('.html') ||
        file.name.endsWith('.htm') ||
        file.name.endsWith('.txt'))
    ) {
      processUploadedFile(file);
    }
  };

  // Link insertion
  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Enter URL to link to:', previousUrl);

    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  // Calculate statistics
  const plainText = editor?.getText() || rawText || '';
  const wordCount = plainText.trim() ? plainText.trim().split(/\s+/).length : 0;
  const charCount = plainText.length;
  const readingTimeMin = Math.ceil(wordCount / 200) || 1;

  runSlashRef.current = (item: SlashCommand) => {
    const current = slashRef.current;
    if (!editor || !current) return;
    const to = editor.state.selection.from;
    const chain = editor
      .chain()
      .focus()
      .deleteRange({ from: current.from, to });
    if (item.id === 'image') {
      chain.run();
      setIsMediaModalOpen(true);
    } else {
      item.run(chain).run();
    }
    setSlash(null);
    setSlashIndex(0);
  };

  if (isPaper) {
    const items = slash ? filterSlashCommands(slash.query) : [];
    const modeTabs: Array<{
      id: 'visual' | 'markdown' | 'html';
      label: string;
      icon: typeof Eye;
    }> = [
      { id: 'visual', label: 'Visual', icon: Eye },
      { id: 'markdown', label: 'Markdown', icon: FileText },
      { id: 'html', label: 'Raw HTML', icon: CodeXml },
    ];
    type ToolItem = {
      id: string;
      title: string;
      icon: typeof Bold;
      active?: boolean;
      disabled?: boolean;
      onClick: () => void;
    };
    const tools: ToolItem[][] = editor
      ? [
          [1, 2, 3].map((level) => ({
            id: `h${level}`,
            title: `Heading ${level}`,
            icon: [Heading1, Heading2, Heading3][level - 1]!,
            active: editor.isActive('heading', { level }),
            onClick: () =>
              editor
                .chain()
                .focus()
                .toggleHeading({ level: level as 1 | 2 | 3 })
                .run(),
          })),
          [
            {
              id: 'bold',
              title: 'Bold',
              icon: Bold,
              active: editor.isActive('bold'),
              onClick: () => editor.chain().focus().toggleBold().run(),
            },
            {
              id: 'italic',
              title: 'Italic',
              icon: Italic,
              active: editor.isActive('italic'),
              onClick: () => editor.chain().focus().toggleItalic().run(),
            },
            {
              id: 'strike',
              title: 'Strikethrough',
              icon: Strikethrough,
              active: editor.isActive('strike'),
              onClick: () => editor.chain().focus().toggleStrike().run(),
            },
            {
              id: 'code',
              title: 'Inline code',
              icon: Code,
              active: editor.isActive('code'),
              onClick: () => editor.chain().focus().toggleCode().run(),
            },
          ],
          [
            {
              id: 'ul',
              title: 'Bulleted list',
              icon: List,
              active: editor.isActive('bulletList'),
              onClick: () => editor.chain().focus().toggleBulletList().run(),
            },
            {
              id: 'ol',
              title: 'Numbered list',
              icon: ListOrdered,
              active: editor.isActive('orderedList'),
              onClick: () => editor.chain().focus().toggleOrderedList().run(),
            },
            {
              id: 'quote',
              title: 'Quote',
              icon: Quote,
              active: editor.isActive('blockquote'),
              onClick: () => editor.chain().focus().toggleBlockquote().run(),
            },
            {
              id: 'hr',
              title: 'Divider',
              icon: Minus,
              onClick: () => editor.chain().focus().setHorizontalRule().run(),
            },
          ],
          [
            {
              id: 'link',
              title: 'Link',
              icon: Link2,
              active: editor.isActive('link'),
              onClick: setLink,
            },
            {
              id: 'image',
              title: 'Insert image',
              icon: ImageIcon,
              onClick: () => setIsMediaModalOpen(true),
            },
          ],
          [
            {
              id: 'undo',
              title: 'Undo',
              icon: Undo2,
              disabled: !editor.can().undo(),
              onClick: () => editor.chain().focus().undo().run(),
            },
            {
              id: 'redo',
              title: 'Redo',
              icon: Redo2,
              disabled: !editor.can().redo(),
              onClick: () => editor.chain().focus().redo().run(),
            },
          ],
        ]
      : [];

    return (
      <div
        className={`transition-colors ${
          isArticle
            ? isDraggingFile
              ? 'rounded-xl ring-2 ring-indigo-200'
              : ''
            : `rounded-2xl border bg-[#FAF8F3] overflow-hidden ${
                isDraggingFile
                  ? 'border-indigo-400 ring-2 ring-indigo-200'
                  : 'border-stone-300/70'
              }`
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDraggingFile(true);
        }}
        onDragLeave={() => setIsDraggingFile(false)}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".md,.markdown,.html,.htm,.txt"
          onChange={handleFileInputChange}
          className="hidden"
        />

        {/* Mode tabs + file import + copy */}
        <div
          className={`flex items-center justify-between gap-2 flex-wrap ${
            isArticle
              ? 'sticky top-0 z-10 px-0 py-2 bg-[#FDFBF7]/95 backdrop-blur border-b border-stone-200/60'
              : 'px-3 py-2 border-b border-stone-200 bg-[#F5F2EA]'
          }`}
        >
          <div
            role="tablist"
            aria-label="Editor mode"
            className="flex items-center gap-1 p-0.5 rounded-lg bg-stone-200/60"
          >
            {modeTabs.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={activeTab === t.id}
                onClick={() => handleTabChange(t.id)}
                className={`px-3 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  activeTab === t.id
                    ? 'bg-[#FAF8F3] text-stone-900 shadow-sm'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                <t.icon className="size-3.5" />
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Import a .md or .html file into this article"
              className="px-2.5 py-1.5 rounded-lg border border-stone-200 bg-[#FAF8F3] text-xs font-medium text-stone-700 hover:bg-stone-100 flex items-center gap-1.5 transition-colors"
            >
              <UploadCloud className="size-3.5 text-indigo-500" />
              Import .md / .html
            </button>
            <button
              type="button"
              aria-label="Copy content"
              title="Copy content to clipboard"
              onClick={async () => {
                const text =
                  activeTab === 'visual' ? editor?.getHTML() || '' : rawText;
                await navigator.clipboard.writeText(text);
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 2000);
              }}
              className="p-1.5 rounded-lg border border-stone-200 bg-[#FAF8F3] text-stone-600 hover:bg-stone-100 transition-colors"
            >
              {isCopied ? (
                <Check className="size-3.5 text-emerald-600" />
              ) : (
                <Copy className="size-3.5" />
              )}
            </button>
          </div>
        </div>

        {importNotification && (
          <div className="px-3 py-1.5 text-xs font-medium bg-emerald-50 text-emerald-700 border-b border-emerald-100 flex items-center gap-2">
            <Check className="size-3.5" />
            {importNotification}
          </div>
        )}

        {/* Formatting toolbar (visual mode) */}
        {activeTab === 'visual' && editor && (
          <div
            className={`flex items-center gap-0.5 flex-wrap ${
              isArticle
                ? 'sticky top-[49px] z-10 px-0 py-1.5 bg-[#FDFBF7]/95 backdrop-blur'
                : 'px-2 py-1.5 border-b border-stone-200 bg-[#FAF8F3]'
            }`}
          >
            {tools.map((group, gi) => (
              <div key={gi} className="flex items-center gap-0.5">
                {gi > 0 && (
                  <span className="w-px h-4 bg-stone-200 mx-1.5" aria-hidden />
                )}
                {group.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    title={t.title}
                    aria-label={t.title}
                    aria-pressed={t.active}
                    disabled={t.disabled}
                    onClick={t.onClick}
                    className={`p-1.5 rounded-md transition-colors disabled:opacity-30 ${
                      t.active
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                    }`}
                  >
                    <t.icon className="size-4" />
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Content area */}
        <div className={isArticle ? 'px-0 py-8' : 'px-6 sm:px-8 py-5'}>
          {activeTab === 'visual' && <EditorContent editor={editor} />}
          {activeTab === 'markdown' && (
            <textarea
              rows={18}
              value={rawText}
              onChange={(e) => {
                setRawText(e.target.value);
                onChange((marked.parse(e.target.value) as string) || '');
              }}
              placeholder="# Write Markdown here..."
              aria-label="Markdown source"
              className={`w-full font-mono text-xs leading-relaxed text-stone-800 focus:outline-none resize-y ${
                isArticle
                  ? 'bg-transparent border-0 px-0 py-0 min-h-[60vh] focus:ring-0'
                  : 'px-3 py-2.5 rounded-xl bg-[#F5F2EA] border border-stone-200 focus:ring-2 focus:ring-indigo-200'
              }`}
            />
          )}
          {activeTab === 'html' && (
            <textarea
              rows={18}
              value={rawText}
              onChange={(e) => {
                setRawText(e.target.value);
                onChange(e.target.value);
              }}
              placeholder="<p>Write raw HTML markup...</p>"
              aria-label="HTML source"
              className={`w-full font-mono text-xs leading-relaxed text-stone-800 focus:outline-none resize-y ${
                isArticle
                  ? 'bg-transparent border-0 px-0 py-0 min-h-[60vh] focus:ring-0'
                  : 'px-3 py-2.5 rounded-xl bg-[#F5F2EA] border border-stone-200 focus:ring-2 focus:ring-indigo-200'
              }`}
            />
          )}
        </div>

        {/* Status bar */}
        <div
          className={`flex items-center justify-between gap-2 flex-wrap text-[11px] text-stone-500 ${
            isArticle
              ? 'px-0 py-4'
              : 'px-4 py-2 border-t border-stone-200 bg-[#F5F2EA]'
          }`}
        >
          <span>
            <strong className="text-stone-700">{wordCount}</strong> words ·{' '}
            <strong className="text-stone-700">{charCount}</strong> characters ·
            ~{readingTimeMin} min read
          </span>
          <span className="flex items-center gap-3">
            <span className="hidden sm:inline">
              Type / for quick blocks · drop a .md / .html file to import
            </span>
            <button
              type="button"
              onClick={async () => {
                const confirmed = await confirmAction({
                  title: 'Clear article content?',
                  message: 'All text in this article will be removed.',
                  confirmText: 'Clear',
                });
                if (confirmed) {
                  editor?.commands.clearContent();
                  onChange('');
                  setRawText('');
                }
              }}
              className="hover:text-rose-600 transition-colors"
            >
              Clear
            </button>
          </span>
        </div>

        {slash && items.length > 0 && (
          <div
            role="listbox"
            aria-label="Insert block"
            style={{ position: 'fixed', top: slash.top, left: slash.left }}
            className="z-50 w-64 rounded-xl border border-stone-200 bg-[#FAF8F3] shadow-xl py-1.5 max-h-72 overflow-y-auto"
          >
            {items.map((item, i) => (
              <button
                key={item.id}
                type="button"
                role="option"
                aria-selected={i === slashIndex}
                onMouseDown={(e) => {
                  e.preventDefault();
                  runSlashRef.current(item);
                }}
                onMouseEnter={() => setSlashIndex(i)}
                className={`w-full text-left px-3 py-2 flex flex-col transition-colors ${
                  i === slashIndex ? 'bg-stone-100' : 'hover:bg-[#F5F2EA]'
                }`}
              >
                <span className="text-sm font-medium text-stone-900">
                  {item.label}
                </span>
                <span className="text-[11px] text-stone-500">{item.hint}</span>
              </button>
            ))}
          </div>
        )}

        <MediaAssetPickerModal
          isOpen={isMediaModalOpen}
          onClose={() => setIsMediaModalOpen(false)}
          onSelect={(asset) => {
            if (editor) {
              const url = getMediaFileUrl(asset.url);
              const alt =
                asset.altText ||
                (asset as { filename?: string }).filename ||
                'image';
              editor.chain().focus().setImage({ src: url, alt }).run();
            }
            setIsMediaModalOpen(false);
          }}
          title="Insert Image into Article Content"
        />
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border transition-all overflow-hidden bg-zinc-950 shadow-md ${
        isDraggingFile
          ? 'border-indigo-500 ring-2 ring-indigo-500/30'
          : 'border-zinc-800'
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDraggingFile(true);
      }}
      onDragLeave={() => setIsDraggingFile(false)}
      onDrop={handleDrop}
    >
      {/* Hidden File Input for Direct Markdown/HTML Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.markdown,.html,.htm,.txt"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Header: Mode Tabs + Direct File Upload Action */}
      <div className="flex items-center justify-between px-3 py-2.5 bg-zinc-900 border-b border-zinc-800 flex-wrap gap-2">
        {/* Left: View Mode Tabs */}
        <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800 gap-1">
          <button
            type="button"
            onClick={() => handleTabChange('visual')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'visual'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Eye className="size-3.5" />
            <span>Visual WYSIWYG</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('markdown')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'markdown'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileText className="size-3.5" />
            <span>Markdown</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('html')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'html'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <CodeXml className="size-3.5" />
            <span>Raw HTML</span>
          </button>
        </div>

        {/* Right: Direct File Upload & Quick Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-zinc-700/60 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            title="Upload and parse a .md or .html file directly into this content block"
          >
            <UploadCloud className="size-3.5 text-indigo-400" />
            <span>Upload .md / .html</span>
          </button>

          <button
            type="button"
            onClick={async () => {
              const textToCopy =
                activeTab === 'markdown'
                  ? rawText
                  : activeTab === 'html'
                    ? rawText
                    : editor?.getHTML() || '';
              await navigator.clipboard.writeText(textToCopy);
              setIsCopied(true);
              setTimeout(() => setIsCopied(false), 2000);
            }}
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
            title="Copy editor content to clipboard"
          >
            {isCopied ? (
              <Check className="size-3.5 text-emerald-400" />
            ) : (
              <Copy className="size-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Optional Notification Toast for File Import */}
      {importNotification && (
        <div className="bg-emerald-500/15 border-b border-emerald-500/30 px-3 py-1.5 flex items-center gap-2 text-emerald-300 text-xs font-medium">
          <Check className="size-3.5 text-emerald-400" />
          <span>{importNotification}</span>
        </div>
      )}

      {/* Visual Mode: TipTap Toolbar */}
      {activeTab === 'visual' && editor && (
        <div className="flex items-center gap-1 p-2 bg-zinc-900/60 border-b border-zinc-800 flex-wrap">
          {/* Headings */}
          <button
            type="button"
            onClick={() => editor.chain().focus().setParagraph().run()}
            className={`px-2 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
              editor.isActive('paragraph')
                ? 'bg-indigo-600 text-white'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
            title="Paragraph"
          >
            P
          </button>
          <button
            type="button"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            className={`p-1.5 rounded transition-colors cursor-pointer ${
              editor.isActive('heading', { level: 1 })
                ? 'bg-indigo-600 text-white'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
            title="Heading 1"
          >
            <Heading1 className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            className={`p-1.5 rounded transition-colors cursor-pointer ${
              editor.isActive('heading', { level: 2 })
                ? 'bg-indigo-600 text-white'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
            title="Heading 2"
          >
            <Heading2 className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
            className={`p-1.5 rounded transition-colors cursor-pointer ${
              editor.isActive('heading', { level: 3 })
                ? 'bg-indigo-600 text-white'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
            title="Heading 3"
          >
            <Heading3 className="size-3.5" />
          </button>

          <div className="w-px h-4 bg-zinc-800 mx-1" />

          {/* Inline Styles */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1.5 rounded transition-colors cursor-pointer ${
              editor.isActive('bold')
                ? 'bg-indigo-600 text-white'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
            title="Bold (Ctrl+B)"
          >
            <Bold className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1.5 rounded transition-colors cursor-pointer ${
              editor.isActive('italic')
                ? 'bg-indigo-600 text-white'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
            title="Italic (Ctrl+I)"
          >
            <Italic className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-1.5 rounded transition-colors cursor-pointer ${
              editor.isActive('strike')
                ? 'bg-indigo-600 text-white'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
            title="Strikethrough"
          >
            <Strikethrough className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={`p-1.5 rounded transition-colors cursor-pointer ${
              editor.isActive('code')
                ? 'bg-indigo-600 text-white'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
            title="Inline Code"
          >
            <Code className="size-3.5" />
          </button>

          <div className="w-px h-4 bg-zinc-800 mx-1" />

          {/* Lists & Quotes */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-1.5 rounded transition-colors cursor-pointer ${
              editor.isActive('bulletList')
                ? 'bg-indigo-600 text-white'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
            title="Bullet List"
          >
            <List className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-1.5 rounded transition-colors cursor-pointer ${
              editor.isActive('orderedList')
                ? 'bg-indigo-600 text-white'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
            title="Numbered List"
          >
            <ListOrdered className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-1.5 rounded transition-colors cursor-pointer ${
              editor.isActive('blockquote')
                ? 'bg-indigo-600 text-white'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
            title="Blockquote"
          >
            <Quote className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={`p-1.5 rounded transition-colors cursor-pointer ${
              editor.isActive('codeBlock')
                ? 'bg-indigo-600 text-white'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
            title="Code Block"
          >
            <FileCode className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Divider Line"
          >
            <Minus className="size-3.5" />
          </button>

          <div className="w-px h-4 bg-zinc-800 mx-1" />

          {/* Links & Images */}
          <button
            type="button"
            onClick={setLink}
            className={`p-1.5 rounded transition-colors cursor-pointer ${
              editor.isActive('link')
                ? 'bg-indigo-600 text-white'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
            title="Add / Edit Link"
          >
            <Link2 className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setIsMediaModalOpen(true)}
            className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Insert Image from Media Library"
          >
            <ImageIcon className="size-3.5" />
          </button>

          <div className="w-px h-4 bg-zinc-800 mx-1" />

          {/* Undo / Redo */}
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30 transition-colors cursor-pointer"
            title="Undo"
          >
            <Undo2 className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30 transition-colors cursor-pointer"
            title="Redo"
          >
            <Redo2 className="size-3.5" />
          </button>
        </div>
      )}

      {/* Editor Content Area */}
      <div className="relative">
        {activeTab === 'visual' && (
          <div className="min-h-[220px]">
            <EditorContent editor={editor} />
          </div>
        )}

        {activeTab === 'markdown' && (
          <div className="p-3">
            <textarea
              rows={12}
              value={rawText}
              onChange={(e) => {
                setRawText(e.target.value);
                const html = (marked.parse(e.target.value) as string) || '';
                onChange(html);
              }}
              placeholder="# Write Markdown here... (e.g. ## Heading, **bold**, - list)"
              className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 font-mono text-xs leading-relaxed focus:outline-none focus:border-indigo-500 custom-scrollbar resize-y"
            />
          </div>
        )}

        {activeTab === 'html' && (
          <div className="p-3">
            <textarea
              rows={12}
              value={rawText}
              onChange={(e) => {
                setRawText(e.target.value);
                onChange(e.target.value);
              }}
              placeholder="<p>Write raw HTML markup...</p>"
              className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-emerald-300 placeholder:text-zinc-600 font-mono text-xs leading-relaxed focus:outline-none focus:border-indigo-500 custom-scrollbar resize-y"
            />
          </div>
        )}
      </div>

      {/* Footer Status Bar: Word Count & Direct Dropzone Hint */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-zinc-900/90 border-t border-zinc-800/80 text-[11px] text-zinc-400 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <span>
            <strong className="text-zinc-200">{wordCount}</strong> words
          </span>
          <span className="text-zinc-600">•</span>
          <span>
            <strong className="text-zinc-200">{charCount}</strong> characters
          </span>
          <span className="text-zinc-600">•</span>
          <span>~{readingTimeMin} min read</span>
        </div>

        <div className="flex items-center gap-2 text-zinc-500">
          <span className="hidden sm:inline">
            Drag & drop .md / .html file directly onto editor
          </span>
          <button
            type="button"
            onClick={async () => {
              const confirmed = await confirmAction({
                title: 'Clear content?',
                message: 'All text in this editor will be removed.',
                confirmText: 'Clear',
              });
              if (confirmed) {
                editor?.commands.clearContent();
                onChange('');
                setRawText('');
              }
            }}
            className="text-zinc-500 hover:text-rose-400 transition-colors ml-1 cursor-pointer"
            title="Clear all content"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Media Picker Modal for inserting images into Rich Text */}
      <MediaAssetPickerModal
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        onSelect={(asset) => {
          if (editor) {
            const url = getMediaFileUrl(asset.url);
            const alt =
              asset.altText ||
              (asset as { filename?: string }).filename ||
              'image';
            editor.chain().focus().setImage({ src: url, alt }).run();
          }
          setIsMediaModalOpen(false);
        }}
        title="Insert Image into Article Content"
      />
    </div>
  );
};
