import React, { useState } from 'react';
import {
  Folder,
  FolderPlus,
  FolderArchive,
  Trash2,
  Layers,
  ChevronRight,
  Plus,
  X,
  Loader2,
} from 'lucide-react';
import type {
  MediaFolder,
  MediaFoldersSidebarProps,
} from '../types/media.types';
import { useCreateFolder, useDeleteFolder } from '../hooks/useMediaQueries';
import { useToast } from '@repo/shared-ui';

export const MediaFoldersSidebar: React.FC<MediaFoldersSidebarProps> = ({
  folders,
  isLoading,
  selectedFolderId,
  onSelectFolder,
  className = '',
}) => {
  const toast = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [folderToDelete, setFolderToDelete] = useState<MediaFolder | null>(
    null,
  );

  const createFolderMutation = useCreateFolder();
  const deleteFolderMutation = useDeleteFolder();

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newFolderName.trim();
    if (!trimmed) return;

    try {
      await createFolderMutation.mutateAsync({ name: trimmed });
      toast.success(`Folder "${trimmed}" created successfully`);
      setNewFolderName('');
      setIsCreating(false);
    } catch {
      toast.error('Failed to create folder');
    }
  };

  const handleDeleteFolder = async (folder: MediaFolder) => {
    try {
      await deleteFolderMutation.mutateAsync(folder.id);
      toast.success(`Folder "${folder.name}" deleted`);
      if (selectedFolderId === folder.id) {
        onSelectFolder(undefined);
      }
      setFolderToDelete(null);
    } catch {
      toast.error('Failed to delete folder');
    }
  };

  return (
    <aside
      className={`w-64 flex-shrink-0 flex flex-col bg-card/50 backdrop-blur-sm border-r border-border p-4 select-none h-full ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-2 border-b border-border">
        <div className="flex items-center gap-2">
          <Folder className="w-4 h-4 text-primary" />
          <span className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
            Folders
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsCreating(true)}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title="Create New Folder"
        >
          <FolderPlus className="w-4 h-4" />
        </button>
      </div>

      {/* Inline Create Folder Form */}
      {isCreating && (
        <form
          onSubmit={handleCreateSubmit}
          className="mb-3 p-3 bg-muted/40 border border-primary/30 rounded-xl shadow-xs"
        >
          <div className="text-[11px] font-semibold text-primary mb-1.5 flex items-center justify-between">
            <span>New Folder</span>
            <button
              type="button"
              onClick={() => {
                setIsCreating(false);
                setNewFolderName('');
              }}
              className="text-muted-foreground hover:text-foreground p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <input
            type="text"
            autoFocus
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Folder name..."
            className="w-full px-2.5 py-1.5 text-xs bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary mb-2 transition-all"
          />
          <div className="flex justify-end gap-1.5">
            <button
              type="button"
              onClick={() => {
                setIsCreating(false);
                setNewFolderName('');
              }}
              className="px-2.5 py-1 text-xs rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!newFolderName.trim() || createFolderMutation.isPending}
              className="px-3 py-1 text-xs font-medium rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 flex items-center gap-1 shadow-xs transition-colors"
            >
              {createFolderMutation.isPending ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Plus className="w-3 h-3" />
              )}
              Create
            </button>
          </div>
        </form>
      )}

      {/* Nav List */}
      <nav className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
        {/* All Assets */}
        <button
          type="button"
          onClick={() => onSelectFolder(undefined)}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
            selectedFolderId === undefined
              ? 'bg-primary/10 text-primary border border-primary/20 font-semibold shadow-xs'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent'
          }`}
        >
          <div className="flex items-center gap-2.5 truncate">
            <Layers className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">All Assets</span>
          </div>
          {selectedFolderId === undefined && (
            <ChevronRight className="w-3.5 h-3.5 text-primary" />
          )}
        </button>

        {/* Uncategorized (Root) */}
        <button
          type="button"
          onClick={() => onSelectFolder('root')}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
            selectedFolderId === 'root'
              ? 'bg-primary/10 text-primary border border-primary/20 font-semibold shadow-xs'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent'
          }`}
        >
          <div className="flex items-center gap-2.5 truncate">
            <FolderArchive className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
            <span className="truncate">Root / Uncategorized</span>
          </div>
          {selectedFolderId === 'root' && (
            <ChevronRight className="w-3.5 h-3.5 text-primary" />
          )}
        </button>

        {/* Custom Folders Section */}
        <div className="pt-4 pb-1">
          <div className="px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            Groupify Folders
          </div>
        </div>

        {isLoading ? (
          <div className="p-4 flex items-center justify-center text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            <span className="text-xs">Loading folders...</span>
          </div>
        ) : folders.length === 0 ? (
          <div className="px-3 py-4 text-center text-xs text-muted-foreground">
            No folders created yet. Click{' '}
            <span className="font-semibold text-foreground">+</span> above to
            groupify your visual assets.
          </div>
        ) : (
          folders.map((folder) => {
            const isSelected = selectedFolderId === folder.id;
            return (
              <div
                key={folder.id}
                className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-primary/10 text-primary border border-primary/20 font-semibold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent'
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelectFolder(folder.id)}
                  className="flex-1 flex items-center gap-2.5 text-left truncate"
                >
                  <Folder
                    className={`w-4 h-4 flex-shrink-0 ${
                      isSelected
                        ? 'text-primary'
                        : 'text-muted-foreground group-hover:text-foreground'
                    }`}
                  />
                  <span className="truncate">{folder.name}</span>
                </button>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFolderToDelete(folder);
                    }}
                    className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    title={`Delete ${folder.name}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </nav>

      {/* Delete Folder Modal Confirmation */}
      {folderToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-foreground mb-2">
              Delete Folder
            </h3>
            <p className="text-xs text-muted-foreground mb-5 leading-relaxed">
              Are you sure you want to delete folder{' '}
              <span className="text-foreground font-semibold">
                &ldquo;{folderToDelete.name}&rdquo;
              </span>
              ? Assets inside this folder will not be deleted but moved to Root.
            </p>
            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setFolderToDelete(null)}
                className="px-4 py-2 text-xs font-medium rounded-xl border border-border text-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteFolder(folderToDelete)}
                disabled={deleteFolderMutation.isPending}
                className="px-4 py-2 text-xs font-medium rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-xs flex items-center gap-1.5 transition-colors"
              >
                {deleteFolderMutation.isPending && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                )}
                Delete Folder
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
