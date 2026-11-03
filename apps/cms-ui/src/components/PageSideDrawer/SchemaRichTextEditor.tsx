import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
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
import { SchemaRichTextEditorProps } from '@/types/pageSchemaMedia.types';
import { convertHtmlToMarkdown } from '@/utils/covertHtmlToMarkdown';

export const SchemaRichTextEditor: React.FC<SchemaRichTextEditorProps> = ({
  value,
  fieldApiId: _fieldApiId,
  fieldDisplayName: _fieldDisplayName = 'Content',
  onChange,
}) => {
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
        placeholder:
          'Write engaging rich text or drop a Markdown/HTML file here...',
      }),
    ],
    content: value || '',
    editorProps: {
      attributes: {
        class:
          'prose prose-invert max-w-none focus:outline-none min-h-[220px] max-h-[500px] overflow-y-auto px-4 py-3 text-sm leading-relaxed text-zinc-200 select-text',
      },
    },
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      onChange(html);
      setRawText(html);
    },
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
            onClick={() => {
              if (confirm('Clear editor content?')) {
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
