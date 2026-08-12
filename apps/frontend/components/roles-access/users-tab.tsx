'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

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
          <Button onClick={() => setIsInviteOpen(true)}>+ Invite User</Button>
          <Modal
            isOpen={isInviteOpen}
            onClose={() => setIsInviteOpen(false)}
            title="Invite User"
            showFooter={false}
          >
            <form onSubmit={handleInvite} className="space-y-4 pt-4">
              <div className="space-y-2">
                <label htmlFor="email">
                  <Typography as="span" variant="label">
                    Email *
                  </Typography>
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(val: string) => setEmail(val)}
                  placeholder="user@example.com"
                  variant="default"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="firstName">
                    <Typography as="span" variant="label">
                      First Name
                    </Typography>
                  </label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(val: string) => setFirstName(val)}
                    placeholder="John"
                    variant="default"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="lastName">
                    <Typography as="span" variant="label">
                      Last Name
                    </Typography>
                  </label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(val: string) => setLastName(val)}
                    placeholder="Doe"
                    variant="default"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Typography variant="label">Role *</Typography>
                <div>
                  <Dropdown
                    trigger={
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        {roles.find((r) => r.id === roleId)?.name ||
                          'Select a role'}
                      </Button>
                    }
                  >
                    {roles.map((r) => (
                      <DropdownItem key={r.id} onSelect={() => setRoleId(r.id)}>
                        {r.name}
                      </DropdownItem>
                    ))}
                  </Dropdown>
                </div>
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
          </Modal>

          <Modal
            isOpen={!!devInviteUrl}
            onClose={() => setDevInviteUrl(null)}
            title="Development Mode: Invite Link"
            showFooter={true}
            confirmText="Copy Link"
            cancelText="Close"
            onConfirm={() => {
              navigator.clipboard.writeText(devInviteUrl || '');
              toast.success('Copied to clipboard');
            }}
            onCancel={() => setDevInviteUrl(null)}
          >
            <div className="space-y-4 pt-4">
              <p className="text-sm text-muted-foreground">
                Since SMTP is not configured in development, you can use this
                link to accept the invitation:
              </p>
              <div className="p-2 border rounded-md bg-muted/20 font-mono text-sm break-all">
                {devInviteUrl || ''}
              </div>
            </div>
          </Modal>
        </div>
      )}

      {/* Confirm Delete Dialog */}
      <Modal
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        title="Delete User"
        showFooter={true}
        confirmText={deleteMutation.isPending ? 'Deleting...' : 'Delete'}
        cancelText="Cancel"
        onConfirm={() => userToDelete && deleteMutation.mutate(userToDelete.id)}
        onCancel={() => setUserToDelete(null)}
        colorScheme="destructive"
      >
        <div className="space-y-4 pt-2">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to permanently delete{' '}
            <span className="font-medium text-foreground">
              {userToDelete?.email}
            </span>
            ? This action cannot be undone.
          </p>
        </div>
      </Modal>

      <div className="border rounded-md overflow-x-auto">
        <DataTable
          columns={[
            { label: 'Email', key: 'email', sortable: true },
            { label: 'Name', key: 'name', sortable: true },
            { label: 'Status', key: 'status', sortable: true },
            { label: 'Role', key: 'role', sortable: true },
            { label: 'Created At', key: 'createdAt', sortable: true },
            ...(isAdmin
              ? [{ label: 'Actions', key: 'actions', sortable: false }]
              : []),
          ]}
          rows={users.map((user) => ({
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            status: <span className="capitalize">{user.status}</span>,
            role: isAdmin ? (
              <Dropdown
                trigger={
                  <Button
                    variant="outline"
                    className="h-8 w-36 text-xs justify-start text-left font-normal"
                  >
                    {roles.find((r) => r.id === user.roleId)?.name || 'No role'}
                  </Button>
                }
              >
                {roles.map((r) => (
                  <DropdownItem
                    key={r.id}
                    onSelect={() =>
                      updateRoleMutation.mutate({
                        userId: user.id,
                        newRoleId: r.id,
                      })
                    }
                  >
                    {r.name}
                  </DropdownItem>
                ))}
              </Dropdown>
            ) : (
              <span className="text-muted-foreground text-sm">
                {roles.find((r) => r.id === user.roleId)?.name ?? '—'}
              </span>
            ),
            createdAt: new Date(user.createdAt).toLocaleDateString(),
            ...(isAdmin
              ? {
                  actions: (
                    <div className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        aria-label={`Delete ${user.email}`}
                        onClick={() => setUserToDelete(user)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ),
                }
              : {}),
          }))}
        />
        {users.length === 0 && (
          <div className="p-8 text-center text-muted-foreground border-t">
            No users found.
          </div>
        )}
      </div>
    </div>
  );
}
