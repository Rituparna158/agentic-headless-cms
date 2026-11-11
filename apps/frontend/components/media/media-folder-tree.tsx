'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listMediaFolders,
  createMediaFolder,
  deleteMediaFolder,
} from '@/lib/api/media';
import {
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Plus,
  Trash2,
  HardDrive,
  FolderPlus,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@repo/shared-ui';
import { cn } from '@/lib/utils';
import { ConfirmDialog } from '@/components/confirm-dialog';
import type { FolderNodeProps } from '@/types/component.types';

function FolderNode({
  folder,
  activeFolderId,
  onSelectFolder,
  level,
}: FolderNodeProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: childrenData } = useQuery({
    queryKey: ['media-folders', folder.id],
    queryFn: () => listMediaFolders(folder.id),
    enabled: isExpanded,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteMediaFolder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-folders'] });
      if (activeFolderId === folder.id) {
        onSelectFolder('root');
      }
    },
  });

  const children = childrenData ?? [];
  const hasChildren = children.length > 0;
  const isActive = activeFolderId === folder.id;

  return (
    <div className="w-full select-none">
      <div
        className={cn(
          'group flex items-center justify-between w-full py-1.5 px-2 rounded-lg text-xs font-medium transition-colors',
          isActive
            ? 'bg-primary text-primary-foreground font-semibold shadow-2xs'
            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
      >
        <div
          className="flex flex-1 items-center gap-1.5 cursor-pointer min-w-0"
          onClick={() => onSelectFolder(folder.id)}
        >
          <div
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="size-4 flex items-center justify-center cursor-pointer shrink-0 opacity-70 hover:opacity-100"
          >
            {hasChildren || isExpanded ? (
              isExpanded ? (
                <ChevronDown className="size-3.5" />
              ) : (
                <ChevronRight className="size-3.5" />
              )
            ) : (
              <span className="size-3.5" />
            )}
          </div>
          {isActive ? (
            <FolderOpen className="size-3.5 shrink-0" />
          ) : (
            <Folder className="size-3.5 shrink-0 opacity-70 group-hover:opacity-100" />
          )}
          <span className="truncate">{folder.name}</span>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'size-5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 rounded',
            isActive
              ? 'text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/20'
              : 'text-muted-foreground hover:text-destructive hover:bg-destructive/10',
          )}
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            setPendingDelete(folder.id);
          }}
          aria-label={`Delete folder ${folder.name}`}
        >
          <Trash2 className="size-3" />
        </Button>
      </div>

      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete Folder?"
        description="Are you sure you want to delete this folder? This will not delete the files inside it."
        onConfirm={() => {
          if (pendingDelete) {
            deleteMutation.mutate(pendingDelete);
          }
        }}
        confirmLabel="Delete"
        destructive={true}
      />

      {isExpanded &&
        children.map((child) => (
          <FolderNode
            key={child.id}
            folder={child}
            activeFolderId={activeFolderId}
            onSelectFolder={onSelectFolder}
            level={level + 1}
          />
        ))}
    </div>
  );
}

export function MediaFolderTree({
  activeFolderId,
  onSelectFolder,
}: {
  activeFolderId: string;
  onSelectFolder: (id: string) => void;
}) {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['media-folders', 'root'],
    queryFn: () => listMediaFolders('root'),
  });

  const [error, setError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: (name: string) =>
      createMediaFolder(
        name,
        activeFolderId === 'root' ? undefined : activeFolderId,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-folders'] });
      setIsCreating(false);
      setNewFolderName('');
      setError(null);
    },
    onError: (err: unknown) => {
      const message =
        err instanceof Error ? err.message : 'Failed to create folder';
      setError(message);
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      createMutation.mutate(newFolderName.trim());
    }
  };

  const rootFolders = data ?? [];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between pb-2 border-b border-border/60">
        <div className="flex items-center gap-1.5">
          <FolderPlus className="size-3.5 text-muted-foreground" />
          <h3 className="font-semibold text-xs text-foreground uppercase tracking-wider">
            Directories
          </h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-6 text-muted-foreground hover:text-foreground"
          onClick={() => setIsCreating(!isCreating)}
          aria-label="Create new folder"
          title="Create new folder"
        >
          <Plus className="size-3.5" />
        </Button>
      </div>

      <div className="flex flex-col gap-1 select-none">
        {/* Root Directory Button */}
        <div
          className={cn(
            'flex items-center gap-2 py-1.5 px-2 rounded-lg text-xs font-medium cursor-pointer transition-colors',
            activeFolderId === 'root'
              ? 'bg-primary text-primary-foreground font-semibold shadow-2xs'
              : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
          )}
          onClick={() => onSelectFolder('root')}
        >
          <HardDrive className="size-3.5 shrink-0 opacity-80" />
          <span className="truncate">Root Library</span>
        </div>

        {/* Dynamic Nested Folders */}
        {isLoading ? (
          <div className="px-6 py-2 text-xs text-muted-foreground animate-pulse">
            Loading folders…
          </div>
        ) : (
          rootFolders.map((folder) => (
            <FolderNode
              key={folder.id}
              folder={folder}
              activeFolderId={activeFolderId}
              onSelectFolder={onSelectFolder}
              level={0}
            />
          ))
        )}
      </div>

      {/* Inline Create Folder Form */}
      {isCreating && (
        <div className="flex flex-col gap-1.5 mt-1 pt-2.5 border-t border-border/60">
          <form
            onSubmit={handleCreate}
            className="flex items-center gap-1.5 w-full"
          >
            <input
              autoFocus
              type="text"
              placeholder="Folder name"
              className="h-8 flex-1 min-w-0 rounded-md border border-input bg-background px-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-all"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === 'Enter') handleCreate(e);
                if (e.key === 'Escape') setIsCreating(false);
              }}
            />
            <Button
              type="submit"
              size="sm"
              className="h-8 text-xs px-2.5 font-medium shrink-0"
              disabled={createMutation.isPending || !newFolderName.trim()}
            >
              Add
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 text-xs px-1.5 text-muted-foreground hover:text-foreground shrink-0"
              onClick={() => setIsCreating(false)}
            >
              Cancel
            </Button>
          </form>
          {error && <p className="text-[11px] text-destructive">{error}</p>}
        </div>
      )}
    </div>
  );
}
