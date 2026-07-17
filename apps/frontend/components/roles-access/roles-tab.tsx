'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listRoles,
  createRole,
  updateRole,
  type RoleRecord,
  type PermissionRecord,
} from '@/lib/api/access';
import { listSchemas } from '@/lib/api/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus } from 'lucide-react';

export function RolesTab() {
  const queryClient = useQueryClient();
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>('new');
  const [editingRole, setEditingRole] = useState<Partial<RoleRecord> | null>(
    null,
  );

  const { data: roles = [], isLoading: isLoadingRoles } = useQuery({
    queryKey: ['access', 'roles'],
    queryFn: listRoles,
  });

  const { data: schemas = [], isLoading: isLoadingSchemas } = useQuery({
    queryKey: ['schemas'],
    queryFn: listSchemas,
  });

  const saveMutation = useMutation({
    mutationFn: async (role: Partial<RoleRecord>) => {
      if (role.id && role.id !== 'new') {
        return updateRole(role.id, role);
      } else {
        return createRole(role);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access', 'roles'] });
    },
  });

  // Derived state for the currently active role form
  const activeRole =
    selectedRoleId === 'new'
      ? editingRole || { name: '', permissions: [] }
      : editingRole && editingRole.id === selectedRoleId
        ? editingRole
        : roles.find((r) => r.id === selectedRoleId);

  const handleSelectRole = (id: string) => {
    setSelectedRoleId(id);
    setEditingRole(null); // Reset local edits when switching
  };

  const updateActiveRole = (updates: Partial<RoleRecord>) => {
    setEditingRole((prev) => ({
      ...(prev || activeRole || {}),
      ...updates,
    }));
  };

  const togglePermission = (
    schemaId: string,
    action: PermissionRecord['action'],
  ) => {
    if (!activeRole) return;
    const currentPerms = activeRole.permissions || [];
    const existing = currentPerms.find(
      (p) => p.schemaId === schemaId && p.action === action,
    );

    let newPerms;
    if (existing) {
      newPerms = currentPerms.filter((p) => p !== existing);
    } else {
      newPerms = [
        ...currentPerms,
        {
          schemaId,
          action,
          effect: 'allow',
          fields: null,
          condition: null,
        } as PermissionRecord,
      ];
    }
    updateActiveRole({ permissions: newPerms });
  };

  const hasPermission = (
    schemaId: string,
    action: PermissionRecord['action'],
  ) => {
    if (!activeRole || !activeRole.permissions) return false;
    return activeRole.permissions.some(
      (p) => p.schemaId === schemaId && p.action === action,
    );
  };

  if (isLoadingRoles || isLoadingSchemas) {
    return (
      <div className="p-8 text-center text-muted-foreground">Loading...</div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-full min-h-0 border rounded-md overflow-hidden">
      {/* LEFT PANE - Roles List */}
      <div className="w-full md:w-64 border-b md:border-b-0 md:border-r flex flex-col bg-muted/20 shrink-0 max-h-64 md:max-h-none">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-semibold text-sm uppercase text-muted-foreground">
            Roles
          </h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleSelectRole('new')}
          >
            <Plus className="size-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <button
            onClick={() => handleSelectRole('new')}
            className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${selectedRoleId === 'new' ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}
          >
            + Create New Role
          </button>
          {roles.map((role) => (
            <button
              key={role.id}
              onClick={() => handleSelectRole(role.id)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${selectedRoleId === role.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}
            >
              {role.name}
            </button>
          ))}
        </div>
      </div>

      {/* RIGHT PANE - Role Details */}
      <div className="flex-1 flex flex-col overflow-y-auto p-6 space-y-6">
        {activeRole ? (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                {selectedRoleId === 'new'
                  ? 'New Role'
                  : `Role: ${activeRole.name}`}
              </h2>
              <Button
                onClick={() => saveMutation.mutate(activeRole)}
                disabled={saveMutation.isPending || !activeRole.name}
              >
                {saveMutation.isPending ? 'Saving...' : 'Save Role'}
              </Button>
            </div>

            <div className="space-y-4 max-w-md">
              <div>
                <label className="text-sm font-medium">Role Name</label>
                <Input
                  value={activeRole.name || ''}
                  onChange={(e) => updateActiveRole({ name: e.target.value })}
                  placeholder="e.g. Content Editor"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Input
                  value={activeRole.description || ''}
                  onChange={(e) =>
                    updateActiveRole({ description: e.target.value })
                  }
                  placeholder="Optional description"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium">Permissions per content-type</h3>
              <div className="border rounded-md overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-center">Read</TableHead>
                      <TableHead className="text-center">Create</TableHead>
                      <TableHead className="text-center">Update</TableHead>
                      <TableHead className="text-center">Delete</TableHead>
                      <TableHead className="text-center">Publish</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schemas.map((schema) => (
                      <TableRow key={schema.id}>
                        <TableCell>{schema.name}</TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={hasPermission(schema.id, 'read')}
                            onCheckedChange={() =>
                              togglePermission(schema.id, 'read')
                            }
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={hasPermission(schema.id, 'create')}
                            onCheckedChange={() =>
                              togglePermission(schema.id, 'create')
                            }
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={hasPermission(schema.id, 'update')}
                            onCheckedChange={() =>
                              togglePermission(schema.id, 'update')
                            }
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={hasPermission(schema.id, 'delete')}
                            onCheckedChange={() =>
                              togglePermission(schema.id, 'delete')
                            }
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={hasPermission(schema.id, 'publish')}
                            onCheckedChange={() =>
                              togglePermission(schema.id, 'publish')
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium">Row-level condition (JSON filter)</h3>
              <p className="text-xs text-muted-foreground">
                Applies to all read/write operations for this role.
              </p>
              <Textarea
                placeholder='e.g. { "author": "$currentUser" }'
                className="font-mono text-sm max-w-xl h-24"
              />
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Select a role to view details
          </div>
        )}
      </div>
    </div>
  );
}
