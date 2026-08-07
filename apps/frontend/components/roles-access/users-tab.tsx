'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  deleteUser,
  inviteUser,
  listRoles,
  listUsers,
  updateUserRole,
} from '@/lib/api/access';
import { UsersTabProps } from '@/types/component.types';
import type { RoleRecord, UserRecord } from '@repo/types';

export function UsersTab({ isAdmin = false }: UsersTabProps) {
  const queryClient = useQueryClient();
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [roleId, setRoleId] = useState('');
  const [devInviteUrl, setDevInviteUrl] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserRecord | null>(null);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['access', 'users'],
    queryFn: listUsers,
  });

  const { data: roles = [] } = useQuery<RoleRecord[]>({
    queryKey: ['access', 'roles'],
    queryFn: listRoles,
    enabled: isAdmin,
  });

  const inviteMutation = useMutation({
    mutationFn: inviteUser,
    onSuccess: (data) => {
      toast.success('Invitation sent');
      queryClient.invalidateQueries({ queryKey: ['access', 'users'] });
      setIsInviteOpen(false);
      setEmail('');
      setFirstName('');
      setLastName('');
      setRoleId('');
      if (data.inviteUrl) {
        setDevInviteUrl(data.inviteUrl);
      }
    },
    onError: (error: unknown) => {
      const msg =
        error instanceof Error ? error.message : 'Failed to invite user';
      toast.error(msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      toast.success('User deleted');
      queryClient.invalidateQueries({ queryKey: ['access', 'users'] });
      setUserToDelete(null);
    },
    onError: (error: unknown) => {
      const msg =
        error instanceof Error ? error.message : 'Failed to delete user';
      toast.error(msg);
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({
      userId,
      newRoleId,
    }: {
      userId: string;
      newRoleId: string;
    }) => updateUserRole(userId, newRoleId),
    onSuccess: () => {
      toast.success('Role updated');
      queryClient.invalidateQueries({ queryKey: ['access', 'users'] });
    },
    onError: (error: unknown) => {
      const msg =
        error instanceof Error ? error.message : 'Failed to update role';
      toast.error(msg);
    },
  });

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !roleId) {
      toast.error('Email and Role are required');
      return;
    }
    inviteMutation.mutate({ email, firstName, lastName, roleId });
  };

  if (isLoading) {
    return (
      <div className="text-center text-muted-foreground py-8">Loading...</div>
    );
  }

  return (
    <div className="space-y-4">
      {isAdmin && (
        <div className="flex justify-end">
          <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
            <DialogTrigger asChild>
              <Button>+ Invite User</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite User</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleInvite} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="John"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Doe"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role *</Label>
                  <Select value={roleId} onValueChange={setRoleId}>
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsInviteOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={inviteMutation.isPending || !email || !roleId}
                  >
                    {inviteMutation.isPending ? 'Sending...' : 'Send Invite'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Dev Mode Notification Modal */}
          <Dialog
            open={!!devInviteUrl}
            onOpenChange={(open) => !open && setDevInviteUrl(null)}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Development Mode: Invite Link</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <p className="text-sm text-muted-foreground">
                  Since SMTP is not configured in development, you can use this
                  link to accept the invitation:
                </p>
                <Input readOnly value={devInviteUrl || ''} />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(devInviteUrl || '');
                      toast.success('Copied to clipboard');
                    }}
                  >
                    Copy Link
                  </Button>
                  <Button onClick={() => setDevInviteUrl(null)}>Close</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Confirm Delete Dialog */}
      <Dialog
        open={!!userToDelete}
        onOpenChange={(open) => !open && setUserToDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to permanently delete{' '}
              <span className="font-medium text-foreground">
                {userToDelete?.email}
              </span>
              ? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setUserToDelete(null)}
                disabled={deleteMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={deleteMutation.isPending}
                onClick={() =>
                  userToDelete && deleteMutation.mutate(userToDelete.id)
                }
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="border rounded-md overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Created At</TableHead>
              {isAdmin && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  {user.firstName} {user.lastName}
                </TableCell>
                <TableCell className="capitalize">{user.status}</TableCell>
                <TableCell>
                  {isAdmin ? (
                    <Select
                      value={user.roleId ?? ''}
                      onValueChange={(newRoleId) =>
                        updateRoleMutation.mutate({
                          userId: user.id,
                          newRoleId,
                        })
                      }
                    >
                      <SelectTrigger className="h-8 w-36 text-xs">
                        <SelectValue placeholder="No role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="text-muted-foreground text-sm">
                      {roles.find((r) => r.id === user.roleId)?.name ?? '—'}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {new Date(user.createdAt).toLocaleDateString()}
                </TableCell>
                {isAdmin && (
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      aria-label={`Delete ${user.email}`}
                      onClick={() => setUserToDelete(user)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
            {users.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={isAdmin ? 6 : 5}
                  className="h-24 text-center"
                >
                  No users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
