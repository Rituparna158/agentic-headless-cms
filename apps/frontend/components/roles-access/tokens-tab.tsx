'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listTokens,
  createToken,
  listRoles,
  revokeToken,
} from '@/lib/api/access';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Trash2, Copy, Check } from 'lucide-react';

export function TokensTab() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTokenName, setNewTokenName] = useState('');
  const [newTokenRoleId, setNewTokenRoleId] = useState('');
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: tokens = [], isLoading } = useQuery({
    queryKey: ['access', 'tokens'],
    queryFn: listTokens,
  });

  const { data: roles = [] } = useQuery({
    queryKey: ['access', 'roles'],
    queryFn: listRoles,
  });

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
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsCreateOpen(true)}>
              Generate Token
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generate API Token</DialogTitle>
            </DialogHeader>

            {generatedToken ? (
              <div className="space-y-4 py-4">
                <p className="text-sm font-medium text-green-600">
                  Token generated successfully! Please copy it now, as you
                  won&apos;t be able to see it again.
                </p>
                <div className="flex gap-2">
                  <Input
                    value={generatedToken}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button variant="outline" size="icon" onClick={handleCopy}>
                    {copied ? (
                      <Check className="size-4 text-green-600" />
                    ) : (
                      <Copy className="size-4" />
                    )}
                  </Button>
                </div>
                <DialogFooter>
                  <Button onClick={closeDialog}>Done</Button>
                </DialogFooter>
              </div>
            ) : (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Token Name</label>
                  <Input
                    placeholder="e.g. CI/CD Script"
                    value={newTokenName}
                    onChange={(e) => setNewTokenName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Role</label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={newTokenRoleId}
                    onChange={(e) => setNewTokenRoleId(e.target.value)}
                  >
                    <option value="" disabled>
                      Select a role...
                    </option>
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={closeDialog}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => createMutation.mutate()}
                    disabled={
                      !newTokenName ||
                      !newTokenRoleId ||
                      createMutation.isPending
                    }
                  >
                    {createMutation.isPending ? 'Generating...' : 'Generate'}
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-md overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tokens.map((token) => (
              <TableRow key={token.id}>
                <TableCell>{token.name}</TableCell>
                <TableCell>
                  {roles.find((r) => r.id === token.roleId)?.name || 'Unknown'}
                </TableCell>
                <TableCell>
                  {new Date(token.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  {token.revokedAt ? (
                    <span className="text-red-500 font-medium">Revoked</span>
                  ) : (
                    <span className="text-green-500 font-medium">Active</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
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
                </TableCell>
              </TableRow>
            ))}
            {tokens.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No tokens generated yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
