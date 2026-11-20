'use client';

import { useState, useMemo } from 'react';
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query';
import {
  Button,
  Badge,
  DataTable,
  Dropdown,
  DropdownItem,
  Card,
  CardContent,
} from '@repo/shared-ui';
import { listWorkflows, deleteWorkflow } from '@/lib/api/workflows';
import { listSchemas } from '@/lib/api/schemas';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { WorkflowBuilderDrawer } from './workflow-builder-drawer';
import type { WorkflowRecord, SchemaRecord } from '@repo/types';
import {
  Workflow,
  Plus,
  ArrowRight,
  Pencil,
  Trash2,
  MoreVertical,
  FileText,
  Milestone,
  GitBranch,
} from 'lucide-react';
import { toast } from 'sonner';

export function WorkflowsList() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sort, setSort] = useState('createdAt:desc');

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<WorkflowRecord | null>(
    null,
  );
  const [pendingDelete, setPendingDelete] = useState<WorkflowRecord | null>(
    null,
  );

  const { data: workflowsData, isLoading } = useQuery({
    queryKey: ['workflows', page, pageSize, sort, search],
    queryFn: () => listWorkflows({ page, pageSize, sort, search }),
    placeholderData: keepPreviousData,
  });

  const { data: schemasData } = useQuery({
    queryKey: ['schemas-lookup'],
    queryFn: () => listSchemas({ pageSize: 100 }),
  });

  const workflows = useMemo<WorkflowRecord[]>(
    () => workflowsData?.data || [],
    [workflowsData?.data],
  );
  const schemas = useMemo<SchemaRecord[]>(
    () => schemasData?.data || [],
    [schemasData?.data],
  );

  const schemaMap = useMemo(() => {
    const map = new Map<string, string>();
    schemas.forEach((s) => map.set(s.id, s.name));
    return map;
  }, [schemas]);

  const stats = useMemo(() => {
    const total = workflows.length;
    const assignedSchemaCount = new Set(
      workflows.flatMap((w) => w.assignedSchemaIds || []),
    ).size;
    const totalStages = workflows.reduce(
      (sum, w) => sum + (w.stages?.length || 0),
      0,
    );
    const totalTransitions = workflows.reduce(
      (sum, w) => sum + (w.transitions?.length || 0),
      0,
    );
    return { total, assignedSchemaCount, totalStages, totalTransitions };
  }, [workflows]);

  const workflowKpis = useMemo(
    () => [
      {
        label: 'Configured Pipelines',
        value: stats.total,
        icon: Workflow,
        iconStyle:
          'bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border border-indigo-500/20',
        description: 'Active editorial workflows',
      },
      {
        label: 'Governed Content Types',
        value: stats.assignedSchemaCount,
        icon: FileText,
        iconStyle:
          'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20',
        description: 'Schemas enforcing review stages',
      },
      {
        label: 'Lifecycle Stages',
        value: stats.totalStages,
        icon: Milestone,
        iconStyle:
          'bg-sky-500/10 text-sky-500 dark:text-sky-400 border border-sky-500/20',
        description: 'Defined review checkpoints',
      },
      {
        label: 'Stage Transitions',
        value: stats.totalTransitions,
        icon: GitBranch,
        iconStyle:
          'bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/20',
        description: 'Allowed movement & role rules',
      },
    ],
    [stats],
  );

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteWorkflow(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      queryClient.invalidateQueries({ queryKey: ['schemas'] });
      toast.success('Workflow deleted successfully');
      setPendingDelete(null);
    },
    onError: (err: unknown) => {
      const message =
        err instanceof Error ? err.message : 'Failed to delete workflow';
      toast.error(message);
    },
  });

  const handleCreateNew = () => {
    setEditingWorkflow(null);
    setIsDrawerOpen(true);
  };

  const handleEdit = (wf: WorkflowRecord) => {
    setEditingWorkflow(wf);
    setIsDrawerOpen(true);
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* 4 KPI Grid Cards (matching Dashboard layout) */}
      <div className="grid gap-3.5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 w-full min-w-0 max-w-full">
        {workflowKpis.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.label}
              className="p-4 border border-border/70 hover:border-border transition-colors shadow-xs w-full min-w-0"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground text-xs font-medium">
                  {stat.label}
                </span>
                <div
                  className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${stat.iconStyle}`}
                >
                  <Icon className="size-4" />
                </div>
              </div>

              <CardContent
                className="p-0 pt-2 pb-1 text-2xl font-bold tracking-tight text-foreground tabular-nums"
                aria-live="polite"
              >
                {stat.value.toLocaleString()}
              </CardContent>

              <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                <span>{stat.description}</span>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Top Bar with Primary Actions */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Editorial Pipelines
          </h2>
          <p className="text-xs text-muted-foreground">
            Manage stage progressions, role approval authority, and governed
            content types.
          </p>
        </div>

        <Button
          onClick={handleCreateNew}
          size="sm"
          className="gap-1.5 text-xs font-medium shrink-0"
        >
          <Plus className="size-4" />
          <span>New Workflow</span>
        </Button>
      </div>

      {/* Industrial Standard ignix-ui DataTable */}
      {isLoading ? (
        <div className="h-64 rounded-xl border border-border/40 bg-muted/20 animate-pulse" />
      ) : workflows.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl border border-dashed border-border bg-card/40">
          <div className="size-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
            <Workflow className="size-6" />
          </div>
          <h3 className="text-base font-semibold text-foreground">
            No workflows configured
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-4">
            Set up editorial workflows to establish stage progressions, require
            team reviews, and enforce publishing permissions.
          </p>
          <Button
            size="sm"
            onClick={handleCreateNew}
            className="gap-1.5 text-xs font-medium"
          >
            <Plus className="size-3.5" />
            <span>Create First Workflow</span>
          </Button>
        </div>
      ) : (
        <div className="w-full max-w-full min-w-0 rounded-xl border border-border/80 bg-card/60 backdrop-blur-sm shadow-2xs overflow-hidden">
          <DataTable
            columns={[
              { label: 'Workflow', key: 'name', sortable: true },
              { label: 'Pipeline Stages', key: 'stages', sortable: false },
              {
                label: 'Governed Content Types',
                key: 'schemas',
                sortable: false,
              },
              { label: 'Last Updated', key: 'updatedAt', sortable: true },
              {
                label: 'Actions',
                key: 'actions',
                sortable: false,
                align: 'right',
              },
            ]}
            rows={workflows.map((wf) => {
              const assignedSchemas = (wf.assignedSchemaIds || [])
                .map((id) => ({
                  id,
                  name: schemaMap.get(id) || 'Unknown Schema',
                }))
                .filter(Boolean);

              const firstStage = wf.stages?.[0];
              const lastStage = wf.stages?.[wf.stages.length - 1];

              return {
                name: (
                  <div className="flex flex-col gap-0.5 py-1 min-w-[160px]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="font-semibold text-foreground text-sm hover:text-primary transition-colors cursor-pointer"
                        onClick={() => handleEdit(wf)}
                      >
                        {wf.name}
                      </span>
                      {wf.isDefault && (
                        <Badge
                          variant="outline"
                          size="sm"
                          className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20 uppercase tracking-wide"
                        >
                          Default
                        </Badge>
                      )}
                    </div>
                    {wf.description && (
                      <span className="text-xs text-muted-foreground truncate max-w-xs">
                        {wf.description}
                      </span>
                    )}
                  </div>
                ),
                stages: (
                  <div className="flex items-center gap-2 py-1 min-w-[180px]">
                    <Badge
                      variant="outline"
                      size="sm"
                      className="text-[11px] font-medium bg-muted/30 border-border/70 shrink-0"
                    >
                      {wf.stages?.length || 0} stages
                    </Badge>
                    {firstStage && lastStage && (
                      <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5 truncate">
                        <span className="text-foreground">
                          {firstStage.name}
                        </span>
                        <ArrowRight className="size-3 text-muted-foreground/60 shrink-0" />
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                          {lastStage.name}
                        </span>
                      </span>
                    )}
                  </div>
                ),
                schemas: (
                  <div className="flex items-center gap-1.5 py-1 min-w-[160px] flex-wrap">
                    <Badge
                      variant="secondary"
                      size="sm"
                      className="text-[11px] font-medium shrink-0"
                    >
                      {wf.assignedSchemaIds?.length || 0} Content Types Linked
                    </Badge>
                    {assignedSchemas.length > 0 && (
                      <span className="text-xs text-muted-foreground truncate max-w-[140px]">
                        ({assignedSchemas.map((s) => s.name).join(', ')})
                      </span>
                    )}
                  </div>
                ),
                updatedAt: (
                  <div className="py-1 text-xs text-muted-foreground">
                    {wf.updatedAt
                      ? new Date(wf.updatedAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : '—'}
                  </div>
                ),
                actions: (
                  <div className="flex items-center justify-end">
                    <Dropdown
                      align="end"
                      trigger={
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="size-8 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
                          title="Actions"
                          aria-label={`Actions for ${wf.name}`}
                        >
                          <span className="sr-only">Open menu</span>
                          <MoreVertical className="size-4" />
                        </Button>
                      }
                    >
                      <DropdownItem
                        onSelect={() => handleEdit(wf)}
                        className="flex items-center gap-2 text-xs cursor-pointer"
                      >
                        <Pencil className="size-3.5 text-muted-foreground" />
                        <span>Edit</span>
                      </DropdownItem>
                      <DropdownItem
                        onSelect={() => setPendingDelete(wf)}
                        className="flex items-center gap-2 text-xs text-destructive focus:text-destructive cursor-pointer"
                      >
                        <Trash2 className="size-3.5" />
                        <span>Delete</span>
                      </DropdownItem>
                    </Dropdown>
                  </div>
                ),
              };
            })}
            enableFiltering={true}
            manualFiltering={true}
            filterPlaceholder="Search workflows by name..."
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
            pageSize={pageSize}
            onPageSizeChange={(newSize: number) => setPageSize(newSize)}
            pageCount={workflowsData?.meta?.pagination?.pageCount ?? 1}
            totalCount={
              workflowsData?.meta?.pagination?.total ?? workflows.length
            }
            onPageChange={(newPage: number) => setPage(newPage)}
            emptyMessage="No workflows match your search criteria."
          />
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete Workflow"
        description={`Are you sure you want to delete "${pendingDelete?.name}"? Any linked content types will no longer follow this workflow.`}
        confirmLabel={deleteMutation.isPending ? 'Deleting…' : 'Delete'}
        destructive
        onConfirm={() =>
          pendingDelete && deleteMutation.mutate(pendingDelete.id)
        }
      />

      {/* Create / Edit Builder Drawer */}
      <WorkflowBuilderDrawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        workflow={editingWorkflow}
      />
    </div>
  );
}
