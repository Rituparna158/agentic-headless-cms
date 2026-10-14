import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileCode,
  Download,
  AlertCircle,
  Loader2,
  CheckCircle2,
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
}) => {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-xl border border-zinc-800 bg-[#141417] text-zinc-100 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Upload className="size-4" />
            </div>
            <div>
              <h3 className="font-semibold text-zinc-100 text-base">
                Import JSON Template
              </h3>
              <p className="text-xs text-zinc-400">
                Upload dynamic template structure or GrapesJS project data
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

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-indigo-500 bg-indigo-500/5'
                : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900/80'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="flex size-12 items-center justify-center rounded-full bg-zinc-800/80 text-zinc-300 mb-3 border border-zinc-700/50">
              <FileCode className="size-6 text-indigo-400" />
            </div>
            <p className="text-sm font-medium text-zinc-200 mb-1">
              {selectedFile
                ? selectedFile.name
                : 'Click to upload or drag & drop'}
            </p>
            <p className="text-xs text-zinc-400">
              Structured JSON or GrapesJS export files (.json)
            </p>
          </div>

          {/* Validation Status */}
          {isValidating && (
            <div className="flex items-center gap-2 text-sm text-zinc-400 bg-zinc-900/60 p-3 rounded-lg border border-zinc-800">
              <Loader2 className="size-4 animate-spin text-indigo-400" />
              <span>Validating template structure...</span>
            </div>
          )}

          {validationResult && validationResult.success && (
            <div className="flex items-start gap-3 text-sm text-emerald-400 bg-emerald-500/10 p-3.5 rounded-lg border border-emerald-500/20">
              <CheckCircle2 className="size-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-emerald-300">
                  Valid Template Structure
                </p>
                <p className="text-xs text-emerald-400/80 mt-0.5">
                  Ready to inject directly into your page canvas.
                </p>
              </div>
            </div>
          )}

          {validationResult && !validationResult.success && (
            <div className="flex items-start gap-3 text-sm text-rose-400 bg-rose-500/10 p-3.5 rounded-lg border border-rose-500/20">
              <AlertCircle className="size-5 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-rose-300">
                  Validation Failed ({validationResult.errors?.length || 1}{' '}
                  issues)
                </p>
                <ul className="text-xs text-rose-400/90 list-disc list-inside space-y-0.5 max-h-32 overflow-y-auto">
                  {validationResult.errors?.map((err, i) => (
                    <li key={i}>
                      <span className="font-mono text-zinc-300">
                        [{err.path}]:
                      </span>{' '}
                      {err.message}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Sample template download button */}
          <div className="flex items-center justify-between rounded-lg bg-zinc-900/60 p-3 border border-zinc-800/80">
            <div className="text-xs text-zinc-400">
              Need a starting format? Download our dynamic starter template.
            </div>
            <button
              type="button"
              onClick={handleDownloadSample}
              className="inline-flex items-center gap-1.5 rounded-md bg-zinc-800 px-2.5 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-700 hover:text-white transition-colors"
            >
              <Download className="size-3.5" />
              <span>Starter JSON</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-zinc-800/80 bg-zinc-900/40 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-xs font-semibold text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!validationResult || !validationResult.success}
            onClick={handleApply}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <span>Apply to Page</span>
          </button>
        </div>
      </div>
    </div>
  );
};
