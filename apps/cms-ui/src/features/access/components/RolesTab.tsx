import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { browserLogger } from '@repo/logger/browser';
import { accessApi } from '../api/access.api';
import type {
  Role,
  RoleWithPermissions,
  ApplicationType,
  CreateRolePayload,
  UpdateRolePayload,
  RoleDetailPanelProps,
} from '../types/access.types';
import {
  CMS_CAPABILITIES,
  buildRolePermissions,
} from '../constants/access.constants';
import { postsApi, extractArrayPayload } from '@/features/posts/api/posts.api';
import type { ContentCollectionMeta } from '@/types/content.types';
import { Plus } from 'lucide-react';
import { useCmsToast } from '@/hooks/useCmsToast';
export const RolesTab = () => {
  const { data: rolesResponse, isLoading: rolesLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: () => accessApi.getRoles(),
  });
  const roles = rolesResponse?.data?.data || [];
  const [selectedRole, setSelectedRole] = useState<Role | 'new' | null>(null);
  return (
    <div className="flex h-full border-t border-border/40">
      {/* Left Master List */}
      <div className="w-64 border-r border-border/40 flex flex-col bg-card/30">
        <div className="p-4 flex items-center justify-between border-b border-border/40">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Roles
          </span>
          <button
            type="button"
            aria-label="Add role"
            className="text-muted-foreground hover:text-foreground"
          >
            <Plus size={16} />
          </button>
        </div>
        <div className="p-3">
          <button
            onClick={() => setSelectedRole('new')}
            className={`w-full py-2 px-3 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
              selectedRole === 'new'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80 text-foreground border border-border/40'
            }`}
          >
            <Plus size={14} /> Create New Role
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {rolesLoading ? (
            <div className="px-4 py-2 text-sm text-muted-foreground">
              Loading...
            </div>
          ) : (
            <ul className="space-y-1 px-2">
              {roles.map((role) => (
                <li key={role.id}>
                  <button
                    onClick={() => setSelectedRole(role)}
                    className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                      selectedRole !== 'new' && selectedRole?.id === role.id
                        ? 'bg-muted text-foreground font-medium'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                  >
                    {role.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      {/* Right Detail Panel */}
      <div className="flex-1 flex flex-col overflow-hidden bg-background">
        {selectedRole ? (
          <RoleDetailPanel
            key={selectedRole === 'new' ? 'new' : selectedRole.id}
            role={selectedRole}
            onClose={() => setSelectedRole(null)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Select a role to view details or create a new one.
          </div>
        )}
      </div>
    </div>
  );
};

const RoleDetailPanel = ({ role, onClose }: RoleDetailPanelProps) => {
  const queryClient = useQueryClient();
  const toast = useCmsToast();
  const isNew = role === 'new';
  const { data: roleDetailsResponse, isLoading } = useQuery({
    queryKey: ['role', !isNew ? role.id : 'new'],
    queryFn: () => (!isNew ? accessApi.getRole(role.id) : null),
    enabled: !isNew,
  });
  const responseData = roleDetailsResponse as
    | { data?: { data?: RoleWithPermissions } | RoleWithPermissions }
    | undefined;
  const data = responseData?.data;
  const fullRole = (data && 'data' in data ? data.data : data) as
    | RoleWithPermissions
    | undefined;
  const { data: rawSites } = useQuery({
    queryKey: ['post-collections'],
    queryFn: () => postsApi.listCollections(),
    staleTime: 5 * 60 * 1000,
  });
  const sites = extractArrayPayload<ContentCollectionMeta>(rawSites);
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    mfaRequired: boolean;
    application: ApplicationType;
    capabilities: string[];
    siteIds: string[];
  }>({
    name: isNew ? '' : role.name,
    description: isNew ? '' : role.description || '',
    mfaRequired: isNew ? false : role.mfaRequired,
    application: isNew ? 'CMS_UI' : role.application,
    capabilities: [] as string[],
    siteIds: [] as string[],
  });
  useEffect(() => {
    if (fullRole) {
      setFormData((prev) => ({
        ...prev,
        capabilities:
          (fullRole.permissions
            ?.map((p) => (p.condition as Record<string, string>)?.capability)
            .filter(Boolean) as string[]) || [],
        siteIds: [
          ...new Set(
            (fullRole.permissions
              ?.map((p) => p.schemaId)
              .filter(Boolean) as string[]) || [],
          ),
        ],
      }));
    }
  }, [fullRole]);
  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => {
      const payload: CreateRolePayload = {
        name: data.name,
        description: data.description,
        mfaRequired: data.mfaRequired,
        application: data.application,
        permissions: buildRolePermissions(data.capabilities, data.siteIds),
      };
      return accessApi.createRole(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      onClose();
    },
    onError: (error) => {
      browserLogger.error('Failed to create role', error);
      toast.error('Failed to create role. Please try again.');
    },
  });
  const updateMutation = useMutation({
    mutationFn: (data: typeof formData) => {
      if (isNew) throw new Error('Cannot update new role');
      const payload: UpdateRolePayload = {
        name: data.name,
        description: data.description,
        mfaRequired: data.mfaRequired,
        permissions: buildRolePermissions(data.capabilities, data.siteIds),
      };
      return accessApi.updateRole(role.id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      if (!isNew) {
        queryClient.invalidateQueries({ queryKey: ['role', role.id] });
      }
      onClose();
    },
    onError: (error) => {
      browserLogger.error('Failed to update role', error);
      toast.error('Failed to update role. Please try again.');
    },
  });
  const mutation = isNew ? createMutation : updateMutation;
  if (!isNew && isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        Loading role details...
      </div>
    );
  }
  return (
    <div className="flex flex-col h-full overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border/40">
        <h2 className="text-xl font-semibold">
          {isNew ? 'New Role' : formData.name}
        </h2>
        <button
          onClick={() => mutation.mutate(formData)}
          disabled={mutation.isPending}
          className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium rounded-md transition-colors disabled:opacity-50"
        >
          {mutation.isPending ? 'Saving...' : 'Save Role'}
        </button>
      </div>
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Basic Info */}
        <div className="space-y-4 max-w-2xl">
          <div className="space-y-2">
            <label
              htmlFor="role-name-input"
              className="text-sm font-medium text-foreground"
            >
              Role Name
            </label>
            <input
              id="role-name-input"
              type="text"
              className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., Content Editor"
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor="role-description-input"
              className="text-sm font-medium text-foreground"
            >
              Description
            </label>
            <textarea
              id="role-description-input"
              className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
              rows={3}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <input type="hidden" value={formData.application} />
          </div>
        </div>
        {/* Which websites the role applies to */}
        <div className="space-y-3">
          <h3 className="text-lg font-medium">Websites</h3>
          <p className="text-xs text-muted-foreground">
            Choose where these capabilities apply. Leave everything unchecked
            for all websites. Managing users always applies to the whole CMS.
          </p>
          <div className="flex flex-wrap gap-2">
            {sites.map((site) => {
              const on = formData.siteIds.includes(site.id);
              return (
                <label
                  key={site.id}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs cursor-pointer ${
                    on
                      ? 'border-primary bg-primary/10 text-foreground'
                      : 'border-border bg-card text-muted-foreground'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="w-3.5 h-3.5"
                    checked={on}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        siteIds: e.target.checked
                          ? [...formData.siteIds, site.id]
                          : formData.siteIds.filter((id) => id !== site.id),
                      })
                    }
                  />
                  {site.name}
                </label>
              );
            })}
            {formData.siteIds.length === 0 && (
              <span className="text-xs text-muted-foreground self-center">
                All websites
              </span>
            )}
          </div>
        </div>
        {/* Permissions Grid */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Role Capabilities</h3>
          <div className="space-y-3">
            {CMS_CAPABILITIES.map((cap) => (
              <div
                key={cap.id}
                className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
              >
                <input
                  id={`role-cap-${cap.id}`}
                  type="checkbox"
                  className="mt-1 w-4 h-4 rounded border-input bg-background text-primary focus:ring-1 focus:ring-ring focus:ring-offset-background"
                  checked={formData.capabilities.includes(cap.id)}
                  onChange={(e) => {
                    const newCaps = e.target.checked
                      ? [...formData.capabilities, cap.id]
                      : formData.capabilities.filter((id) => id !== cap.id);
                    setFormData({ ...formData, capabilities: newCaps });
                  }}
                />
                <label
                  htmlFor={`role-cap-${cap.id}`}
                  className="flex flex-col cursor-pointer flex-1"
                >
                  <span className="text-sm font-medium text-foreground">
                    {cap.label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {cap.description}
                  </span>
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
