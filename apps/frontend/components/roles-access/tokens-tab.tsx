'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Copy, Trash2 } from 'lucide-react';
import { useState } from 'react';

import {
  Button,
  Modal,
  Input,
  Typography,
  Dropdown,
  DropdownItem,
  DataTable,
} from '@repo/shared-ui';
import {
  createToken,
  listRoles,
  listTokens,
  revokeToken,
} from '@/lib/api/access';

export function TokensTab() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTokenName, setNewTokenName] = useState('');
  const [newTokenRoleId, setNewTokenRoleId] = useState('');
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sort, setSort] = useState('createdAt:desc');
  const [search, setSearch] = useState('');

  const { data: tokensData, isLoading } = useQuery({
    queryKey: ['access', 'tokens', page, pageSize, sort, search],
    queryFn: () => listTokens({ page, pageSize, sort, search }),
  });

  const { data: rolesData } = useQuery({
    queryKey: ['access', 'roles'],
    queryFn: () => listRoles({ page: 1, pageSize: 100 }),
  });

  const tokens = tokensData?.data || [];
  const roles = rolesData?.data || [];

  const createMutation = useMutation({
    mutationFn: () =>
      createToken({ name: newTokenName, roleId: newTokenRoleId, type: 'user' }),
    onSuccess: (data) => {
      setGeneratedToken(data.rawToken || null);
      queryClient.invalidateQueries({ queryKey: ['access', 'tokens'] });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => revokeToken(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access', 'tokens'] });
    },
  });

  const handleCopy = () => {
    if (generatedToken) {
      navigator.clipboard.writeText(generatedToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const closeDialog = () => {
    setIsCreateOpen(false);
    setGeneratedToken(null);
    setNewTokenName('');
    setNewTokenRoleId('');
  };

  if (isLoading) {
    return (
      <div className="text-center text-muted-foreground py-8">Loading...</div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setIsCreateOpen(true)}>Generate Token</Button>
        <Modal
          isOpen={isCreateOpen}
          onClose={closeDialog}
          title="Generate API Token"
          showFooter={false}
        >
          {generatedToken ? (
            <div className="space-y-4 py-4">
              <p className="text-sm font-medium text-green-600">
                Token generated successfully
              </p>
              <p className="text-sm text-muted-foreground">
                Please copy it now, as you won&apos;t be able to see it again.
              </p>
              <div className="flex gap-2 items-center">
                <Input
                  disabled
                  placeholder="Token string"
                  variant="default"
                  value={generatedToken}
                  className="font-mono text-sm flex-1"
                />
                <Button variant="outline" size="icon" onClick={handleCopy}>
                  {copied ? (
                    <Check className="size-4 text-green-600" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                </Button>
              </div>
              <div className="flex justify-end pt-2">
                <Button onClick={closeDialog}>Done</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Typography variant="label">Token Name</Typography>
                <Input
                  placeholder="e.g. CI/CD Script"
                  value={newTokenName}
                  onChange={(val: string) => setNewTokenName(val)}
                  variant="default"
                />
              </div>
              <div className="space-y-2">
                <Typography variant="label">Role</Typography>
                <div>
                  <Dropdown
                    trigger={
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        {roles.find((r) => r.id === newTokenRoleId)?.name ||
                          'Select a role...'}
                      </Button>
                    }
                  >
                    {roles.map((r) => (
                      <DropdownItem
                        key={r.id}
                        onSelect={() => setNewTokenRoleId(r.id)}
                      >
                        {r.name}
                      </DropdownItem>
                    ))}
                  </Dropdown>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t mt-6">
                <Button type="button" variant="outline" onClick={closeDialog}>
                  Cancel
                </Button>
                <Button type="button" onClick={() => createMutation.mutate()}>
                  {createMutation.isPending ? 'Generating...' : 'Generate'}
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>

      <div className="border rounded-md overflow-x-auto">
        <DataTable
          columns={[
            { label: 'Name', key: 'name', sortable: true },
            { label: 'Role', key: 'role', sortable: true },
            { label: 'Created At', key: 'createdAt', sortable: true },
            { label: 'Status', key: 'status', sortable: true },
            { label: 'Actions', key: 'actions', sortable: false },
          ]}
          rows={tokens.map((token) => ({
            name: token.name,
            role: roles.find((r) => r.id === token.roleId)?.name || 'Unknown',
            createdAt: new Date(token.createdAt).toLocaleDateString(),
            status: token.revokedAt ? (
              <span className="text-red-500 font-medium">Revoked</span>
            ) : (
              <span className="text-green-500 font-medium">Active</span>
            ),
            actions: (
              <div className="text-right">
                {!token.revokedAt && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:text-red-600"
                    onClick={() => revokeMutation.mutate(token.id)}
                    title="Revoke Token"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </div>
            ),
          }))}
          enableFiltering={true}
          manualFiltering={true}
          filterPlaceholder="Search tokens..."
          onSearchChange={(val: string) => {
            setSearch(val);
            setPage(1);
          }}
          enableSorting={true}
          manualSorting={true}
          defaultSortKey={sort.split(':')[0]}
          defaultSortDirection={sort.split(':')[1] as 'asc' | 'desc'}
          onSortChange={(
            key: string | number | symbol,
            direction: 'asc' | 'desc',
          ) => {
            setSort(`${String(key)}:${direction}`);
            setPage(1);
          }}
          enablePagination={true}
          manualPagination={true}
          page={page}
          pageCount={tokensData?.meta?.pagination?.pageCount ?? 1}
          pageSize={pageSize}
          onPageSizeChange={(newSize: number) => setPageSize(newSize)}
          onPageChange={(newPage: number) => setPage(newPage)}
        />
        {tokens.length === 0 && (
          <div className="p-8 text-center text-muted-foreground border-t">
            No tokens generated yet.
          </div>
        )}
      </div>
    </div>
  );
}
