import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, FileText } from 'lucide-react';
import { pagesApi } from '../api/pages.api';
import { usePageSchema } from '../hooks/usePageSchema';

function slugify(text: string): string {
  return (
    '/' +
    text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/[\s]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
  );
}

interface CreatePageDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreatePageDialog({ isOpen, onClose }: CreatePageDialogProps) {
  const [title, setTitle] = useState('');
  const [show, setShow] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const schemaQuery = usePageSchema();

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      // Slight delay to trigger animation
      const timer = setTimeout(() => setShow(true), 10);
      return () => clearTimeout(timer);
    } else {
      setShow(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    setShow(false);
    setTimeout(() => {
      onClose();
    }, 200); // Wait for transition
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!schemaQuery.data) throw new Error('Schema not ready');
      return pagesApi.createPage({
        title: title.trim(),
        slug: slugify(title),
        body: [],
      });
    },
    onSuccess: (entry) => {
      queryClient.invalidateQueries({ queryKey: ['pages'] });
      setTitle('');
      handleClose();
      navigate(`/pages/${entry.id}`);
    },
  });

  const handleConfirm = () => {
    if (!title.trim() || !schemaQuery.data || createMutation.isPending) return;
    createMutation.mutate();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleConfirm();
    if (e.key === 'Escape') handleClose();
  };

  if (!isOpen && !show) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-200 ${show ? 'opacity-100' : 'opacity-0'}`}
    >
      <div
        onClick={handleClose}
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
      />
      <div
        className={`relative w-full max-w-md bg-card rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-border overflow-hidden transition-transform duration-200 ${show ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground tracking-tight">
                Create New Page
              </h2>
              <p className="text-xs text-muted-foreground">
                Start with a blank canvas
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label
              htmlFor="page-title"
              className="block text-sm font-medium text-foreground mb-2"
            >
              Page Title
            </label>
            <input
              id="page-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. Home, About Us..."
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all shadow-sm"
              autoFocus
            />
          </div>

          <div className="bg-muted/30 rounded-xl p-4 border border-border/50">
            <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">
              URL Slug Preview
            </p>
            <p className="text-sm font-mono text-foreground truncate">
              {slugify(title) || '/'}
            </p>
          </div>

          {createMutation.isError && (
            <p className="text-sm text-destructive font-medium">
              Failed to create page. Please try again.
            </p>
          )}
        </div>

        <div className="px-6 py-5 bg-muted/20 border-t border-border/50 flex items-center justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={
              !title.trim() || !schemaQuery.data || createMutation.isPending
            }
            className="px-6 py-2.5 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm"
          >
            {createMutation.isPending ? 'Creating...' : 'Create Page'}
          </button>
        </div>
      </div>
    </div>
  );
}
