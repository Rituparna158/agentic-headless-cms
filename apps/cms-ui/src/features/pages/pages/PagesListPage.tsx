import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, FileText, Trash2 } from 'lucide-react';
import {
  pagesApi,
  type PageEntry,
  type PaginatedResponse,
} from '../api/pages.api';
import { usePageSchema } from '../hooks/usePageSchema';
import { CreatePageDialog } from '../components/CreatePageDialog';
import { useToast } from '@repo/shared-ui';

export function PagesListPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(
    () => searchParams.get('create') === 'true',
  );
  const [pageToDelete, setPageToDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const toast = useToast();

  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      setIsCreateOpen(true);
      navigate('/pages', { replace: true });
    }
  }, [searchParams, navigate]);

  const schemaQuery = usePageSchema();

  const pagesQuery = useQuery({
    queryKey: ['pages'],
    queryFn: () => pagesApi.listPages(),
    enabled: !!schemaQuery.data,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => pagesApi.deletePage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pages'] });
      setPageToDelete(null);
      toast.error('Page deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete page. Please try again.');
    },
  });

  const handleDeleteConfirm = () => {
    if (pageToDelete) {
      deleteMutation.mutate(pageToDelete.id);
    }
  };

  const pages =
    (pagesQuery.data as PaginatedResponse<PageEntry> | undefined)?.data ?? [];

  return (
    <div className="p-6 max-w-5xl mx-auto relative">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pages</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your website pages
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          disabled={!schemaQuery.data}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Create New Page
        </button>
      </div>

      {pagesQuery.isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      {!pagesQuery.isLoading && pages.length === 0 && (
        <div className="text-center py-12 border border-dashed border-border rounded-2xl">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-1">
            No pages yet
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Create your first page to get started
          </p>
          <button
            onClick={() => setIsCreateOpen(true)}
            disabled={!schemaQuery.data}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Create New Page
          </button>
        </div>
      )}

      {!pagesQuery.isLoading && pages.length > 0 && (
        <div className="border border-border rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                  Title
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                  Slug
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">
                  Status
                </th>
                <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {pages.map((page) => (
                <tr
                  key={page.id}
                  className="border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors group"
                >
                  <td className="px-4 py-3">
                    <Link
                      to={`/pages/${page.id}`}
                      className="text-foreground font-medium hover:text-primary transition-colors"
                    >
                      {page.data.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-muted-foreground font-mono">
                      {page.data.slug}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        page.status === 'published'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}
                    >
                      {page.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        to={`/pages/${page.id}`}
                        className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() =>
                          setPageToDelete({
                            id: page.id,
                            title: page.data.title,
                          })
                        }
                        className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                        title="Delete Page"
                        aria-label={`Delete ${page.data.title}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CreatePageDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />

      {/* Clean Minimalistic Delete Modal */}
      {pageToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
            onClick={() => setPageToDelete(null)}
          />
          <div className="relative bg-card rounded-xl shadow-lg border border-border w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-foreground mb-2">
                Are you absolutely sure?
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                This action cannot be undone. This will permanently delete the{' '}
                <span className="font-medium text-foreground">
                  &quot;{pageToDelete.title}&quot;
                </span>{' '}
                page and remove its data from our servers.
              </p>

              {deleteMutation.isError && (
                <p className="text-sm font-medium text-destructive mb-4">
                  Failed to delete page. Please try again.
                </p>
              )}

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
                <button
                  onClick={() => setPageToDelete(null)}
                  className="mt-3 sm:mt-0 px-4 py-2 text-sm font-medium rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={deleteMutation.isPending}
                  className="px-4 py-2 text-sm font-medium rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {deleteMutation.isPending ? 'Deleting...' : 'Delete Page'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
