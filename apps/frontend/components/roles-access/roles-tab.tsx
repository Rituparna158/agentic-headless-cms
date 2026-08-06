'use client';

import type { PermissionRecord, RoleRecord, SchemaRecord } from '@repo/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { createRole, listRoles, updateRole } from '@/lib/api/access';
import { listSchemas } from '@/lib/api/schemas';

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

  /**
   * Selects a role from the list to view/edit.
   */
  const handleSelectRole = (id: string) => {
    setSelectedRoleId(id);
    setEditingRole(null);
  };

  /**
   * Applies partial updates to the currently active role state.
   */
  const updateActiveRole = (updates: Partial<RoleRecord>) => {
    setEditingRole((prev) => ({
      ...(prev || activeRole || {}),
      ...updates,
    }));
  };

  /**
   * Toggles a specific permission action for a given schema on the active role.
   */
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

  /**
   * Checks if the active role has a specific permission action for a schema.
   */
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
      <RoleList
        roles={roles}
        selectedRoleId={selectedRoleId}
        onSelectRole={handleSelectRole}
      />
      <RoleDetails
        activeRole={activeRole}
        schemas={schemas}
        selectedRoleId={selectedRoleId}
        isSaving={saveMutation.isPending}
        onSave={() => saveMutation.mutate(activeRole as Partial<RoleRecord>)}
        onUpdateRole={updateActiveRole}
        onTogglePermission={togglePermission}
        hasPermission={hasPermission}
      />
    </div>
  );
}

/**
 * Renders the sidebar list of roles, including a button to create a new role.
 */
function RoleList({
  roles,
  selectedRoleId,
  onSelectRole,
}: {
  roles: RoleRecord[];
  selectedRoleId: string | null;
  onSelectRole: (id: string) => void;
}) {
  return (
    <div className="w-full md:w-64 border-b md:border-b-0 md:border-r flex flex-col bg-muted/20 shrink-0 max-h-64 md:max-h-none">
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-semibold text-sm uppercase text-muted-foreground">
          Roles
        </h3>
        <Button variant="ghost" size="icon" onClick={() => onSelectRole('new')}>
          <Plus className="size-4" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        <button
          onClick={() => onSelectRole('new')}
          className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${selectedRoleId === 'new' ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}
        >
          + Create New Role
        </button>
        {roles.map((role) => (
          <button
            key={role.id}
            onClick={() => onSelectRole(role.id)}
            className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${selectedRoleId === role.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}
          >
            {role.name}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Renders the details pane for the selected role, allowing editing of name, description, and permissions.
 */
function RoleDetails({
  activeRole,
  schemas,
  selectedRoleId,
  isSaving,
  onSave,
  onUpdateRole,
  onTogglePermission,
  hasPermission,
}: {
  activeRole: Partial<RoleRecord> | undefined;
  schemas: SchemaRecord[];
  selectedRoleId: string | null;
  isSaving: boolean;
  onSave: () => void;
  onUpdateRole: (updates: Partial<RoleRecord>) => void;
  onTogglePermission: (
    schemaId: string,
    action: PermissionRecord['action'],
  ) => void;
  hasPermission: (
    schemaId: string,
    action: PermissionRecord['action'],
  ) => boolean;
}) {
  if (!activeRole) {
    return (
      <div className="flex-1 flex items-center justify-center h-full text-muted-foreground">
        Select a role to view details
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-y-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          {selectedRoleId === 'new' ? 'New Role' : `Role: ${activeRole.name}`}
        </h2>
        <Button onClick={onSave} disabled={isSaving || !activeRole.name}>
          {isSaving ? 'Saving...' : 'Save Role'}
        </Button>
      </div>

      <div className="space-y-4 max-w-md">
        <div>
          <label className="text-sm font-medium">Role Name</label>
          <Input
            value={activeRole.name || ''}
            onChange={(e) => onUpdateRole({ name: e.target.value })}
            placeholder="e.g. Content Editor"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Description</label>
          <Input
            value={activeRole.description || ''}
            onChange={(e) => onUpdateRole({ description: e.target.value })}
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
                        onTogglePermission(schema.id, 'read')
                      }
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Checkbox
                      checked={hasPermission(schema.id, 'create')}
                      onCheckedChange={() =>
                        onTogglePermission(schema.id, 'create')
                      }
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Checkbox
                      checked={hasPermission(schema.id, 'update')}
                      onCheckedChange={() =>
                        onTogglePermission(schema.id, 'update')
                      }
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Checkbox
                      checked={hasPermission(schema.id, 'delete')}
                      onCheckedChange={() =>
                        onTogglePermission(schema.id, 'delete')
                      }
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Checkbox
                      checked={hasPermission(schema.id, 'publish')}
                      onCheckedChange={() =>
                        onTogglePermission(schema.id, 'publish')
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
    </div>
  );
}
