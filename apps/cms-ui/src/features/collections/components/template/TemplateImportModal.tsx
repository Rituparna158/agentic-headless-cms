import { activateOnKey } from '@/utils/a11y.util';
import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileCode,
  Download,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Copy,
} from 'lucide-react';
import {
  TemplateImportModalProps,
  TemplateValidationResult,
} from '../../types/template.types';
import { SAMPLE_DYNAMIC_TEMPLATE } from '../../constants/template.constants';
import { validateAndParseDynamicTemplate } from '../../utils/template-parser.util';

export const TemplateImportModal: React.FC<TemplateImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
  availablePages = [],
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'inherit'>('upload');
  const [selectedPageId, setSelectedPageId] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] =
    useState<TemplateValidationResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDownloadSample = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(SAMPLE_DYNAMIC_TEMPLATE, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'starter-template.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const processFile = async (file: File) => {
    if (!file.name.endsWith('.json')) {
      setValidationResult({
        success: false,
        errors: [
          {
            path: 'File Type',
            message:
              'Only .json files are supported. Please upload a valid JSON template.',
          },
        ],
      });
      return;
    }

    setSelectedFile(file);
    setIsValidating(true);
    setValidationResult(null);

    try {
      const text = await file.text();
      const result = validateAndParseDynamicTemplate(text);
      setValidationResult(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to read file';
      setValidationResult({
        success: false,
        errors: [{ path: 'File Read', message: msg }],
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]!);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]!);
    }
  };

  const handleApply = () => {
    if (validationResult && validationResult.success) {
      onImport(validationResult);
      onClose();
    }
  };

  const handleApplyInheritedPage = () => {
    const page = availablePages.find((p) => p.id === selectedPageId);
    if (!page) return;
    const pData = (page.data || {}) as Record<string, unknown>;
    const body = pData.body as Record<string, unknown> | undefined;
    if (body) {
      onImport({
        success: true,
        data: body,
        projectData:
          typeof body.projectData === 'object' && body.projectData !== null
            ? (body.projectData as Record<string, unknown>)
            : undefined,
        html: typeof body.html === 'string' ? body.html : undefined,
        css: typeof body.css === 'string' ? body.css : undefined,
      });
    } else {
      onImport({
        success: true,
        html: '',
        css: '',
      });
    }
    onClose();
  };

  const selectedPage = availablePages.find((p) => p.id === selectedPageId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-xl border border-zinc-800 bg-[#141417] text-zinc-100 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {activeTab === 'upload' ? (
                <Upload className="size-4" />
              ) : (
                <Copy className="size-4" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-zinc-100 text-base">
                {activeTab === 'upload'
                  ? 'Import JSON Template'
                  : 'Inherit Page Design'}
              </h3>
              <p className="text-xs text-zinc-400">
                {activeTab === 'upload'
                  ? 'Upload dynamic template structure or GrapesJS project data'
                  : 'Copy layout and styling from an existing page'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        {availablePages.length > 0 && (
          <div className="flex border-b border-zinc-800/80 bg-zinc-900/40 px-6 text-xs font-medium">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`py-2.5 px-3 border-b-2 transition-colors ${
                activeTab === 'upload'
                  ? 'border-indigo-500 text-indigo-400 font-semibold'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Upload JSON Template
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('inherit')}
              className={`py-2.5 px-3 border-b-2 transition-colors ${
                activeTab === 'inherit'
                  ? 'border-indigo-500 text-indigo-400 font-semibold'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Inherit from Existing Page ({availablePages.length})
            </button>
          </div>
        )}

        {/* Content */}
        <div className="p-6 space-y-5">
          {activeTab === 'upload' ? (
            <>
              {/* Dropzone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                role="button"
                tabIndex={0}
                aria-label="Upload a template JSON file"
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={activateOnKey(() => fileInputRef.current?.click())}
                className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-indigo-500 bg-indigo-500/5'
                    : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900/80'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <div className="flex size-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 mb-3 border border-indigo-500/20">
                  <FileCode className="size-6" />
                </div>
                <p className="text-sm font-medium text-zinc-200 mb-1">
                  Drag & drop template JSON, or{' '}
                  <span className="text-indigo-400 hover:underline">
                    browse
                  </span>
                </p>
                <p className="text-xs text-zinc-500">
                  Supports .json files up to 5MB
                </p>
              </div>

              {/* Sample link */}
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>Need a starter structure?</span>
                <button
                  onClick={handleDownloadSample}
                  className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                >
                  <Download className="size-3.5" />
                  Download Sample Template
                </button>
              </div>

              {/* Validation Status */}
              {isValidating && (
                <div className="flex items-center gap-2 rounded-lg bg-zinc-900/80 p-3 text-xs text-zinc-400 border border-zinc-800">
                  <Loader2 className="size-4 animate-spin text-indigo-400" />
                  Validating schema and structure...
                </div>
              )}

              {validationResult && (
                <div
                  className={`rounded-xl border p-4 text-xs ${
                    validationResult.success
                      ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                      : 'border-red-500/20 bg-red-500/10 text-red-300'
                  }`}
                >
                  <div className="flex items-center gap-2 font-semibold mb-1">
                    {validationResult.success ? (
                      <>
                        <CheckCircle2 className="size-4 text-emerald-400" />
                        Valid Template Format ({selectedFile?.name})
                      </>
                    ) : (
                      <>
                        <AlertCircle className="size-4 text-red-400" />
                        Invalid Template Structure
                      </>
                    )}
                  </div>
                  {validationResult.errors && (
                    <ul className="list-disc list-inside space-y-1 text-red-300/80 mt-2">
                      {validationResult.errors.map((e, idx) => (
                        <li key={idx}>
                          <span className="font-mono text-[11px] text-red-300">
                            {e.path}:
                          </span>{' '}
                          {e.message}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </>
          ) : (
            /* Inherit from Existing Page Tab */
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="inherit-source-page"
                  className="block text-xs font-semibold text-zinc-200 mb-1.5"
                >
                  Select Source Page
                </label>
                <select
                  id="inherit-source-page"
                  value={selectedPageId}
                  onChange={(e) => setSelectedPageId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500"
                >
                  <option value="">
                    -- Choose a page from this website --
                  </option>
                  {availablePages.map((p) => {
                    const pTitle =
                      p.title || (p.data?.title as string) || 'Untitled';
                    const pSlug = p.slug || (p.data?.slug as string) || p.id;
                    return (
                      <option key={p.id} value={p.id}>
                        {pTitle} ({pSlug})
                      </option>
                    );
                  })}
                </select>
              </div>

              {selectedPage && (
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-200">
                      {selectedPage.title ||
                        (selectedPage.data?.title as string) ||
                        'Untitled'}
                    </span>
                    <span className="font-mono text-zinc-400 text-[11px]">
                      {selectedPage.slug ||
                        (selectedPage.data?.slug as string) ||
                        selectedPage.id}
                    </span>
                  </div>
                  <p className="text-zinc-400 text-[11px] leading-relaxed">
                    Importing this page will copy all of its canvas components,
                    layout sections, and styles onto your current workspace.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-zinc-800/80 bg-zinc-900/30 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-xs font-medium text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
          >
            Cancel
          </button>
          {activeTab === 'upload' ? (
            <button
              onClick={handleApply}
              disabled={!validationResult || !validationResult.success}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm shadow-indigo-500/20"
            >
              Apply Template
            </button>
          ) : (
            <button
              onClick={handleApplyInheritedPage}
              disabled={!selectedPageId}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm shadow-indigo-500/20"
            >
              <Copy className="size-3.5" />
              Inherit Page Design
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
