import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listMediaFolders,
  createMediaFolder,
  deleteMediaFolder,
} from '@/lib/api/media';
import {
  Folder,
  ChevronRight,
  ChevronDown,
  Plus,
  Trash2,
  Home,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@repo/shared-ui';
import { Input } from '@repo/shared-ui';
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

  return (
    <div className="w-full">
      <div
        className={cn(
          'group flex items-center justify-between w-full py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors',
          activeFolderId === folder.id &&
            'bg-primary/10 text-primary font-medium',
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
      >
        <div
          className="flex flex-1 items-center gap-2 cursor-pointer"
          onClick={() => onSelectFolder(folder.id)}
        >
          <div
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="w-4 h-4 flex items-center justify-center cursor-pointer text-muted-foreground hover:text-foreground"
          >
            {hasChildren || isExpanded ? (
              isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )
            ) : null}
          </div>
          <Folder className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm truncate">{folder.name}</span>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="w-6 h-6 opacity-0 group-hover:opacity-100 h-full text-muted-foreground hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            setPendingDelete(folder.id);
          }}
        >
          <Trash2 className="w-4 h-4" />
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
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
          Folders
        </h3>
        <Button
          variant="ghost"
          size="icon"
          className="w-6 h-6"
          onClick={() => setIsCreating(!isCreating)}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex flex-col gap-1">
        <div
          className={cn(
            'flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer hover:bg-muted/50 transition-colors',
            activeFolderId === 'root' &&
              'bg-primary/10 text-primary font-medium',
          )}
          onClick={() => onSelectFolder('root')}
        >
          <div className="w-4 h-4 flex items-center justify-center">
            <Home className="w-4 h-4 text-muted-foreground" />
          </div>
          <span className="text-sm">Media Library</span>
        </div>

        {isLoading ? (
          <div className="px-8 py-2 text-sm text-muted-foreground">
            Loading...
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

      {isCreating && (
        <div className="flex flex-col gap-1 mt-2 px-2">
          <form onSubmit={handleCreate} className="flex gap-2">
            <Input
              autoFocus
              variant="default"
              placeholder="Folder name"
              className="h-8 flex-1"
              value={newFolderName}
              onChange={(val) => setNewFolderName(val)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate(e);
                if (e.key === 'Escape') setIsCreating(false);
              }}
            />
            <Button
              type="submit"
              size="sm"
              className="h-8"
              disabled={createMutation.isPending || !newFolderName.trim()}
            >
              Add
            </Button>
          </form>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      )}
    </div>
  );
}
