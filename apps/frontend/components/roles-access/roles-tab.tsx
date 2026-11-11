'use client';

import type { PermissionRecord, RoleRecord, SchemaRecord } from '@repo/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Shield, Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import {
  Badge,
  Button,
  Input,
  Checkbox,
  Textarea,
  DataTable,
} from '@repo/shared-ui';
import { createRole, listRoles, updateRole } from '@/lib/api/access';
import { listSchemas } from '@/lib/api/schemas';
import { cn } from '@/lib/utils';

export function RolesTab() {
  const queryClient = useQueryClient();
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>('new');
  const [editingRole, setEditingRole] = useState<Partial<RoleRecord> | null>(
    null,
  );

  const { data: rolesData, isLoading: isLoadingRoles } = useQuery({
    queryKey: ['access', 'roles'],
    queryFn: () => listRoles({ page: 1, pageSize: 100 }),
  });

  const { data: schemasData, isLoading: isLoadingSchemas } = useQuery({
    queryKey: ['schemas'],
    queryFn: () => listSchemas({ page: 1, pageSize: 100 }),
  });

  const roles = rolesData?.data || [];
  const schemas = schemasData?.data || [];

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
      ? editingRole || {
          name: '',
          application: 'HEADLESS_CMS',
          permissions: [],
        }
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
    const activeCondition =
      currentPerms.find(
        (p) => p.condition && Object.keys(p.condition).length > 0,
      )?.condition || null;

    const existing = currentPerms.find(
      (p) => p.schemaId === schemaId && p.action === action,
    );

    let newPerms: PermissionRecord[];
    if (existing) {
      newPerms = currentPerms.filter((p) => p !== existing);
    } else {
      newPerms = [
        ...currentPerms.filter(
          (p) => !(p.schemaId === null && p.action === '*'),
        ),
        {
          schemaId,
          action,
          effect: 'allow',
          fields: null,
          condition: activeCondition,
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
    <div className="flex flex-col md:flex-row h-full min-h-0 border border-border rounded-xl overflow-hidden bg-card shadow-xs">
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
    <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-border flex flex-col bg-muted/15 shrink-0 max-h-44 md:max-h-none">
      <div className="p-3.5 border-b border-border flex items-center justify-between">
        <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
          Roles
        </h3>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 text-muted-foreground hover:text-foreground"
          onClick={() => onSelectRole('new')}
          aria-label="Create new role"
        >
          <Plus className="size-4" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        <button
          type="button"
          onClick={() => onSelectRole('new')}
          className={cn(
            'w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer flex items-center justify-between',
            selectedRoleId === 'new'
              ? 'bg-primary/10 text-primary font-semibold ring-1 ring-primary/20'
              : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
          )}
        >
          <span>+ Create New Role</span>
          <Sparkles className="size-3.5 opacity-60" />
        </button>
        {roles.map((role) => {
          const isSelected = selectedRoleId === role.id;
          const isSystem =
            role.isSystem ||
            ['admin', 'super_admin'].includes(role.name.toLowerCase());
          return (
            <button
              key={role.id}
              type="button"
              onClick={() => onSelectRole(role.id)}
              className={cn(
                'w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer flex items-center justify-between gap-2',
                isSelected
                  ? 'bg-primary/10 text-primary font-semibold ring-1 ring-primary/20'
                  : 'text-foreground hover:bg-accent/50',
              )}
            >
              <span className="flex items-center gap-2 truncate">
                <Shield
                  className={cn(
                    'size-3.5 shrink-0',
                    isSelected ? 'text-primary' : 'text-muted-foreground',
                  )}
                />
                <span className="truncate">{role.name}</span>
              </span>
              {isSystem ? (
                <Badge
                  variant="outline"
                  size="sm"
                  className="text-[10px] uppercase font-mono shrink-0"
                >
                  System
                </Badge>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function getInitialCondition(role: Partial<RoleRecord> | undefined): string {
  if (!role || !role.permissions) return '';
  const permWithCondition = role.permissions.find(
    (p) => p.condition && Object.keys(p.condition).length > 0,
  );
  if (permWithCondition?.condition) {
    try {
      return JSON.stringify(permWithCondition.condition, null, 2);
    } catch {
      return '';
    }
  }
  return '';
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
  const [conditionText, setConditionText] = useState(() =>
    getInitialCondition(activeRole),
  );
  const [jsonError, setJsonError] = useState<string | null>(null);

  const lastRoleIdRef = useRef<string | null>(selectedRoleId);
  useEffect(() => {
    if (selectedRoleId !== lastRoleIdRef.current) {
      lastRoleIdRef.current = selectedRoleId;
      setConditionText(getInitialCondition(activeRole));
      setJsonError(null);
    }
  }, [selectedRoleId, activeRole]);

  const handleConditionChange = (text: string) => {
    setConditionText(text);

    const trimmed = text.trim();
    if (!trimmed) {
      setJsonError(null);
      const currentPerms = activeRole?.permissions || [];
      const updatedPerms = currentPerms
        .filter((p) => !(p.schemaId === null && p.action === '*'))
        .map((p) => ({ ...p, condition: null }));
      onUpdateRole({ permissions: updatedPerms });
      return;
    }

    try {
      const parsed = JSON.parse(trimmed);
      if (
        typeof parsed !== 'object' ||
        parsed === null ||
        Array.isArray(parsed)
      ) {
        setJsonError(
          'Condition must be a valid JSON object (e.g. { "author": "$currentUser" })',
        );
        return;
      }
      setJsonError(null);

      const currentPerms = activeRole?.permissions || [];
      let updatedPerms: PermissionRecord[];
      if (currentPerms.length === 0) {
        updatedPerms = [
          {
            schemaId: null,
            action: '*',
            effect: 'allow',
            fields: null,
            condition: parsed,
          } as PermissionRecord,
        ];
      } else {
        updatedPerms = currentPerms.map((p) => ({
          ...p,
          condition: parsed,
        }));
      }
      onUpdateRole({ permissions: updatedPerms });
    } catch {
      setJsonError('Invalid JSON format');
    }
  };

  if (!activeRole) {
    return (
      <div className="flex-1 flex items-center justify-center h-full text-muted-foreground p-8">
        Select a role to view details
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-y-auto p-5 sm:p-6 space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-border/70">
        <div>
          <h2 className="text-xl font-semibold text-foreground">
            {selectedRoleId === 'new' ? 'New Role' : `Role: ${activeRole.name}`}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {selectedRoleId === 'new'
              ? 'Configure a new custom access profile with granular permissions.'
              : 'Modify authorization scope and content permissions for this role.'}
          </p>
        </div>
        <Button
          onClick={onSave}
          disabled={isSaving || !activeRole.name || Boolean(jsonError)}
          size="sm"
        >
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
      </div>

      <div className="space-y-4 max-w-lg bg-card/50 p-4 rounded-xl border border-border/70">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Role Name
          </label>
          <Input
            value={activeRole.name || ''}
            onChange={(val: string) => onUpdateRole({ name: val })}
            placeholder="e.g. Content Editor"
            variant="default"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Description
          </label>
          <Input
            value={activeRole.description || ''}
            onChange={(val: string) => onUpdateRole({ description: val })}
            placeholder="Optional description"
            variant="default"
          />
        </div>
        <label
          htmlFor="mfaRequired"
          className="flex items-center gap-2.5 p-2.5 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer"
        >
          <Checkbox
            id="mfaRequired"
            checked={activeRole.mfaRequired || false}
            onChange={(checked: boolean) =>
              onUpdateRole({ mfaRequired: !!checked })
            }
          />
          <div className="min-w-0">
            <span className="text-sm font-medium text-foreground leading-none">
              Require Multi-Factor Authentication (MFA)
            </span>
            <p className="text-xs text-muted-foreground mt-0.5">
              Enforce two-factor verification before accessing protected CMS
              resources.
            </p>
          </div>
        </label>
      </div>

      <div className="space-y-3">
        <div>
          <h3 className="font-semibold text-sm text-foreground">
            Permissions per Content Type
          </h3>
          <p className="text-xs text-muted-foreground">
            Explicitly authorize CRUD and publishing capabilities across each
            schema.
          </p>
        </div>
        <div className="border border-border rounded-xl overflow-hidden bg-background">
          <DataTable
            enablePagination={false}
            columns={[
              { label: 'Content Type', key: 'type', sortable: true },
              { label: 'Read', key: 'read', sortable: false, align: 'center' },
              {
                label: 'Create',
                key: 'create',
                sortable: false,
                align: 'center',
              },
              {
                label: 'Update',
                key: 'update',
                sortable: false,
                align: 'center',
              },
              {
                label: 'Delete',
                key: 'delete',
                sortable: false,
                align: 'center',
              },
              {
                label: 'Publish',
                key: 'publish',
                sortable: false,
                align: 'center',
              },
            ]}
            rows={schemas.map((schema) => ({
              type: (
                <span className="font-medium text-sm text-foreground">
                  {schema.name}
                </span>
              ),
              read: (
                <div className="flex items-center justify-center">
                  <Checkbox
                    checked={hasPermission(schema.id, 'read')}
                    onChange={() => onTogglePermission(schema.id, 'read')}
                  />
                </div>
              ),
              create: (
                <div className="flex items-center justify-center">
                  <Checkbox
                    checked={hasPermission(schema.id, 'create')}
                    onChange={() => onTogglePermission(schema.id, 'create')}
                  />
                </div>
              ),
              update: (
                <div className="flex items-center justify-center">
                  <Checkbox
                    checked={hasPermission(schema.id, 'update')}
                    onChange={() => onTogglePermission(schema.id, 'update')}
                  />
                </div>
              ),
              delete: (
                <div className="flex items-center justify-center">
                  <Checkbox
                    checked={hasPermission(schema.id, 'delete')}
                    onChange={() => onTogglePermission(schema.id, 'delete')}
                  />
                </div>
              ),
              publish: (
                <div className="flex items-center justify-center">
                  <Checkbox
                    checked={hasPermission(schema.id, 'publish')}
                    onChange={() => onTogglePermission(schema.id, 'publish')}
                  />
                </div>
              ),
            }))}
          />
        </div>
      </div>

      <div className="space-y-2 pb-2">
        <h3 className="font-semibold text-sm text-foreground">
          Row-Level Condition (JSON Filter)
        </h3>
        <p className="text-xs text-muted-foreground">
          Applies to all read/write operations for this role (e.g. restrict to
          author-owned records).
        </p>
        <Textarea
          placeholder='e.g. { "author": "$currentUser" }'
          className="max-w-xl mb-0"
          textareaClassName="font-mono text-xs sm:text-sm bg-muted/20"
          variant="default"
          value={conditionText}
          onChange={handleConditionChange}
          error={jsonError || undefined}
          minRows={3}
          maxRows={8}
        />
        {jsonError ? (
          <p className="text-xs text-destructive font-mono mt-1">{jsonError}</p>
        ) : null}
      </div>
    </div>
  );
}
