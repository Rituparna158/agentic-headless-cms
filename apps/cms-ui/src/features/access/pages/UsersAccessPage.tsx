import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accessApi } from '../api/access.api';
import { User, Role } from '../types/access.types';
import { Button, Typography, DataTable } from '@repo/shared-ui';
import { Plus, Trash2 } from 'lucide-react';
import { InviteUserDialog } from '../components/InviteUserDialog';
import { useAuthStore } from '../../auth/store/auth.store';
export const UsersAccessPage = () => {
  const currentUser = useAuthStore((state) => state.user);
  const isSuperAdmin = currentUser?.roles?.some((roleName: string) =>
    roleName.toLowerCase().includes('admin'),
  );
  const queryClient = useQueryClient();
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const { data: usersResponse, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: accessApi.getUsers,
  });
  const { data: rolesResponse } = useQuery({
    queryKey: ['roles'],
    queryFn: accessApi.getRoles,
  });
  const users = usersResponse?.data?.data || [];
  const roles = rolesResponse?.data?.data || [];
  const deleteMutation = useMutation({
    mutationFn: (id: string) => accessApi.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
  const updateRoleMutation = useMutation({
    mutationFn: ({ id, roleId }: { id: string; roleId: string }) =>
      accessApi.updateUserRole(id, roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to remove this user?')) {
      deleteMutation.mutate(id);
    }
  };
  const handleRoleChange = (userId: string, newRoleId: string) => {
    updateRoleMutation.mutate({ id: userId, roleId: newRoleId });
  };
  return (
    <div className="flex flex-col h-full bg-background animate-in fade-in duration-300">
      <div className="flex items-center justify-between p-6 border-b border-border/40">
        <div>
          <Typography variant="h3" className="font-semibold text-foreground">
            All Users
          </Typography>
          <Typography variant="body" className="text-muted-foreground mt-1">
            Manage your team members and their roles.
          </Typography>
        </div>
        <Button onClick={() => setIsInviteDialogOpen(true)} className="gap-2">
          <Plus size={16} />
          Invite User
        </Button>
      </div>
      <div className="flex-1 overflow-auto p-6">
        {usersLoading ? (
          <div className="p-8 text-center text-muted-foreground">
            Loading users...
          </div>
        ) : (
          <DataTable
            className="rounded-xl border border-border/40 bg-card shadow-sm overflow-hidden"
            columns={[
              { key: 'user', label: 'USER' },
              { key: 'role', label: 'ROLE' },
              { key: 'status', label: 'STATUS' },
              { key: 'joined', label: 'JOINED' },
              { key: 'actions', label: 'ACTIONS', sortable: false },
            ]}
            rows={users.map((user: User & { roleId?: string }) => {
              const currentRoleId = user.roleId || user.roles?.[0]?.id;
              const userRole = roles.find((r: Role) => r.id === currentRoleId);
              const canEditRole = isSuperAdmin && user.id !== currentUser?.id;
              return {
                id: user.id,
                user: (
                  <div className="flex items-center gap-3 py-1">
                    <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                      {user.firstName
                        ? user.firstName.charAt(0).toUpperCase()
                        : user.email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-foreground">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {user.email}
                      </div>
                    </div>
                  </div>
                ),
                role: canEditRole ? (
                  <select
                    className="bg-transparent border border-transparent hover:border-input focus:border-input rounded px-2 py-1 -ml-2 transition-colors cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring text-sm"
                    value={currentRoleId || ''}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    disabled={updateRoleMutation.isPending}
                  >
                    <option value="" disabled>
                      No Role
                    </option>
                    {roles.map((role: Role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="font-medium text-foreground text-sm">
                    {userRole?.name || 'No Role'}
                  </span>
                ),
                status: (
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      user.status === 'active'
                        ? 'bg-green-500/10 text-green-500'
                        : 'bg-yellow-500/10 text-yellow-500'
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        user.status === 'active'
                          ? 'bg-green-500'
                          : 'bg-yellow-500'
                      }`}
                    />
                    {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                  </span>
                ),
                joined: (
                  <span className="text-sm text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                ),
                actions: (
                  <div className="flex justify-end">
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors p-2 rounded-md hover:bg-muted"
                      title="Remove user"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ),
              };
            })}
            enablePagination
            enableFiltering
            filterPlaceholder="Search users..."
          />
        )}
      </div>
      {isInviteDialogOpen && (
        <InviteUserDialog onClose={() => setIsInviteDialogOpen(false)} />
      )}
    </div>
  );
};
