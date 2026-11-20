'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Drawer,
  Button,
  Input,
  Badge,
  Checkbox,
  Switch,
  Dropdown,
  DropdownItem,
  Tabs,
} from '@repo/shared-ui';
import { listSchemas } from '@/lib/api/schemas';
import { listRoles } from '@/lib/api/access';
import {
  listWorkflows,
  createWorkflow,
  updateWorkflow,
  getActiveEntriesInStage,
} from '@/lib/api/workflows';
import type {
  WorkflowRecord,
  WorkflowStage,
  WorkflowTransition,
  CreateWorkflowInput,
  UpdateWorkflowInput,
  RoleRecord,
  SchemaRecord,
} from '@repo/types';
import {
  Plus,
  Trash2,
  Shield,
  Search,
  Lock,
  CheckCircle2,
  ChevronDown,
  Check,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/confirm-dialog';

interface WorkflowBuilderDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workflow: WorkflowRecord | null;
}

const STANDARD_TEMPLATE_STAGES: WorkflowStage[] = [
  {
    id: 'stage-draft',
    name: 'Draft',
    slug: 'draft',
    color: '#64748b',
    order: 0,
    isInitial: true,
    isFinal: false,
  },
  {
    id: 'stage-review',
    name: 'In Review',
    slug: 'in_review',
    color: '#3b82f6',
    order: 1,
    isInitial: false,
    isFinal: false,
  },
  {
    id: 'stage-approved',
    name: 'Approved',
    slug: 'approved',
    color: '#10b981',
    order: 2,
    isInitial: false,
    isFinal: true,
  },
];

const STANDARD_TEMPLATE_TRANSITIONS: WorkflowTransition[] = [
  {
    id: 'trans-1',
    name: 'Submit for Review',
    fromStage: 'draft',
    toStage: 'in_review',
    requiredRoleIds: [],
  },
  {
    id: 'trans-2',
    name: 'Approve Content',
    fromStage: 'in_review',
    toStage: 'approved',
    requiredRoleIds: ['admin', 'editor'],
  },
  {
    id: 'trans-3',
    name: 'Request Changes',
    fromStage: 'in_review',
    toStage: 'draft',
    requiredRoleIds: ['admin', 'editor'],
  },
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '_')
    .replace(/^-+|-+$/g, '');
}

export function WorkflowBuilderDrawer({
  open,
  onOpenChange,
  workflow,
}: WorkflowBuilderDrawerProps) {
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [isDefaultConfirmOpen, setIsDefaultConfirmOpen] = useState(false);
  const [stages, setStages] = useState<WorkflowStage[]>([]);
  const [transitions, setTransitions] = useState<WorkflowTransition[]>([]);
  const [selectedSchemaIds, setSelectedSchemaIds] = useState<string[]>([]);
  const [schemaSearch, setSchemaSearch] = useState('');
  const [activeTab, setActiveTab] = useState<
    'stages' | 'transitions' | 'schemas'
  >('stages');

  const handleLoadTemplate = () => {
    setStages(STANDARD_TEMPLATE_STAGES);
    setTransitions(STANDARD_TEMPLATE_TRANSITIONS);
    toast.success('Loaded standard review template');
  };

  // Fetch schemas and roles
  const { data: schemasData } = useQuery({
    queryKey: ['schemas-for-workflow'],
    queryFn: () => listSchemas({ pageSize: 100 }),
    enabled: open,
  });

  const { data: rolesData } = useQuery({
    queryKey: ['roles-for-workflow'],
    queryFn: () => listRoles({ pageSize: 100 }),
    enabled: open,
  });

  // Fetch all existing workflows to prevent duplicate schema assignment
  const { data: allWorkflowsData } = useQuery({
    queryKey: ['workflows-assignment-check'],
    queryFn: () => listWorkflows({ pageSize: 100 }),
    enabled: open,
  });

  const availableSchemas: SchemaRecord[] = schemasData?.data || [];
  const availableRoles: RoleRecord[] = rolesData?.data || [];

  // Map of schemaId -> workflow that owns it
  const schemaOwnershipMap = useMemo(() => {
    const map = new Map<string, { workflowId: string; workflowName: string }>();
    const list = allWorkflowsData?.data || [];
    list.forEach((wf) => {
      wf.assignedSchemaIds?.forEach((schemaId) => {
        map.set(schemaId, {
          workflowId: wf.id,
          workflowName: wf.name,
        });
      });
    });
    return map;
  }, [allWorkflowsData?.data]);

  const existingDefaultWorkflow = useMemo(() => {
    const list = allWorkflowsData?.data || [];
    return list.find((wf) => wf.isDefault && wf.id !== workflow?.id) || null;
  }, [allWorkflowsData?.data, workflow?.id]);

  const handleDefaultToggle = (checked: boolean) => {
    if (checked && existingDefaultWorkflow) {
      setIsDefaultConfirmOpen(true);
    } else {
      setIsDefault(checked);
    }
  };

  useEffect(() => {
    if (workflow) {
      setName(workflow.name);
      setDescription(workflow.description || '');
      setIsDefault(workflow.isDefault);
      setStages(workflow.stages || []);
      setTransitions(workflow.transitions || []);
      setSelectedSchemaIds(workflow.assignedSchemaIds || []);
    } else {
      setName('');
      setDescription('');
      setIsDefault(false);
      setStages([]);
      setTransitions([]);
      setSelectedSchemaIds([]);
    }
    setIsDefaultConfirmOpen(false);
    setActiveTab('stages');
  }, [workflow, open]);

  // Stage Helpers
  const addStage = () => {
    const nextOrder = stages.length;
    let stageName = `Stage ${nextOrder + 1}`;
    let isInitial = false;
    let isFinal = false;
    let color = '#3b82f6';

    if (nextOrder === 0) {
      stageName = 'Draft';
      isInitial = true;
      color = '#64748b';
    } else if (nextOrder === 1 && !stages.some((s) => s.isFinal)) {
      stageName = 'Published';
      isFinal = true;
      color = '#10b981';
    }

    const newStage: WorkflowStage = {
      id: `stage-${Date.now()}`,
      name: stageName,
      slug: slugify(stageName),
      color,
      order: nextOrder,
      isInitial,
      isFinal,
    };
    setStages([...stages, newStage]);

    // Automatically connect with previous stage
    if (stages.length > 0) {
      const prevStage = stages[stages.length - 1];
      if (prevStage) {
        setTransitions((prev) => [
          ...prev,
          {
            id: `trans-${Date.now()}`,
            name: `Move to ${stageName}`,
            fromStage: prevStage.slug,
            toStage: newStage.slug,
            requiredRoleIds: [],
          },
        ]);
      }
    }
  };

  const updateStage = (index: number, updates: Partial<WorkflowStage>) => {
    setStages((prev) => {
      const copy = [...prev];
      const existing = copy[index];
      if (!existing) return prev;

      const oldSlug = existing.slug;
      const newStage = { ...existing, ...updates };

      if (updates.isInitial) {
        copy.forEach((s, i) => {
          s.isInitial = i === index;
          if (i === index) s.isFinal = false;
        });
      }

      if (updates.isFinal) {
        newStage.isInitial = false;
      }

      // Assign semantic color automatically
      if (newStage.isInitial) {
        newStage.color = '#64748b';
      } else if (newStage.isFinal) {
        newStage.color = '#10b981';
      } else {
        newStage.color = '#3b82f6';
      }

      copy[index] = newStage;

      // Update transitions if slug changed
      if (updates.slug && updates.slug !== oldSlug) {
        setTransitions((transList) =>
          transList.map((t) => ({
            ...t,
            fromStage: t.fromStage === oldSlug ? updates.slug! : t.fromStage,
            toStage: t.toStage === oldSlug ? updates.slug! : t.toStage,
          })),
        );
      }

      return copy;
    });
  };

  const removeStage = async (index: number) => {
    const stageToRemove = stages[index];
    if (!stageToRemove) return;

    if (stages.length <= 1) {
      toast.error('A workflow must have at least one stage');
      return;
    }

    // Safe stage deletion guard: Prevent removing if active content entries are in this stage
    if (
      workflow?.id &&
      workflow.stages?.some((s) => s.slug === stageToRemove.slug)
    ) {
      try {
        const { count } = await getActiveEntriesInStage(
          workflow.id,
          stageToRemove.slug,
        );
        if (count > 0) {
          toast.error(
            `Cannot delete stage "${stageToRemove.name || stageToRemove.slug}" because ${count} active content ${count === 1 ? 'entry is' : 'entries are'} currently sitting in this stage. Please transition entries to another stage first.`,
          );
          return;
        }
      } catch {
        // If query fails, saveMutation will perform final validation
      }
    }

    const newStages = stages
      .filter((_, i) => i !== index)
      .map((s, idx) => ({ ...s, order: idx }));

    if (stageToRemove.isInitial && newStages.length > 0) {
      newStages[0]!.isInitial = true;
    }

    setStages(newStages);

    // Remove transitions referencing removed stage
    setTransitions((prev) =>
      prev.filter(
        (t) =>
          t.fromStage !== stageToRemove.slug &&
          t.toStage !== stageToRemove.slug,
      ),
    );
  };

  // Transition Handlers
  const addTransition = () => {
    if (stages.length < 2) {
      toast.error('Add at least two stages before adding transitions');
      return;
    }
    const fromStage = stages[0]?.slug || 'draft';
    const toStage = stages[1]?.slug || stages[0]?.slug || 'approved';
    const newTransition: WorkflowTransition = {
      id: `trans-${Date.now()}`,
      name: `Advance to ${stages[1]?.name || 'Next Stage'}`,
      fromStage,
      toStage,
      requiredRoleIds: [],
    };
    setTransitions([...transitions, newTransition]);
  };

  const updateTransition = (
    index: number,
    updates: Partial<WorkflowTransition>,
  ) => {
    setTransitions((prev) => {
      const copy = [...prev];
      if (!copy[index]) return prev;
      copy[index] = { ...copy[index]!, ...updates };
      return copy;
    });
  };

  const removeTransition = (index: number) => {
    setTransitions((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleTransitionRole = (transitionIndex: number, roleName: string) => {
    setTransitions((prev) => {
      const copy = [...prev];
      const trans = copy[transitionIndex];
      if (!trans) return prev;

      const roles = trans.requiredRoleIds || [];
      const updatedRoles = roles.includes(roleName)
        ? roles.filter((r) => r !== roleName)
        : [...roles, roleName];

      copy[transitionIndex] = { ...trans, requiredRoleIds: updatedRoles };
      return copy;
    });
  };

  // Schema Handlers with exclusivity check
  const toggleSchema = (schemaId: string) => {
    const owner = schemaOwnershipMap.get(schemaId);
    if (owner && owner.workflowId !== workflow?.id) {
      toast.error(
        `This content type is already governed by "${owner.workflowName}". A content type can only belong to one workflow.`,
      );
      return;
    }

    setSelectedSchemaIds((prev) =>
      prev.includes(schemaId)
        ? prev.filter((id) => id !== schemaId)
        : [...prev, schemaId],
    );
  };

  const filteredSchemas = availableSchemas.filter((s) => {
    if (!schemaSearch.trim()) return true;
    const q = schemaSearch.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.slug.toLowerCase().includes(q);
  });

  const availableSelectableSchemas = filteredSchemas.filter((s) => {
    const owner = schemaOwnershipMap.get(s.id);
    return !owner || owner.workflowId === workflow?.id;
  });

  const handleSelectAllAvailable = () => {
    const selectableIds = availableSelectableSchemas.map((s) => s.id);
    const allSelected =
      selectableIds.length > 0 &&
      selectableIds.every((id) => selectedSchemaIds.includes(id));

    if (allSelected) {
      setSelectedSchemaIds((prev) =>
        prev.filter((id) => !selectableIds.includes(id)),
      );
    } else {
      setSelectedSchemaIds((prev) =>
        Array.from(new Set([...prev, ...selectableIds])),
      );
    }
  };

  // Submission Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error('Workflow name is required');
      if (stages.length === 0)
        throw new Error('At least one stage is required');

      const hasInitial = stages.some((s) => s.isInitial);
      if (!hasInitial) throw new Error('One stage must be marked as Initial');

      const hasFinal = stages.some((s) => s.isFinal);
      if (!hasFinal)
        throw new Error('At least one stage must be marked as Publish stage');

      const payload: CreateWorkflowInput | UpdateWorkflowInput = {
        name: name.trim(),
        description: description.trim() || null,
        isDefault,
        stages: stages.map((s, idx) => ({
          ...s,
          order: idx,
          slug: s.slug || slugify(s.name),
        })),
        transitions,
        schemaIds: selectedSchemaIds,
      };

      if (workflow) {
        return updateWorkflow(workflow.id, payload);
      } else {
        return createWorkflow(payload as CreateWorkflowInput);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      queryClient.invalidateQueries({ queryKey: ['schemas'] });
      queryClient.invalidateQueries({
        queryKey: ['workflows-assignment-check'],
      });
      toast.success(
        workflow
          ? 'Workflow updated successfully'
          : 'Workflow created successfully',
      );
      onOpenChange(false);
    },
    onError: (err: unknown) => {
      const message =
        err instanceof Error ? err.message : 'Failed to save workflow';
      toast.error(message);
    },
  });

  return (
    <>
      <Drawer
        isOpen={open}
        onClose={() => onOpenChange(false)}
        title={
          workflow ? `Edit Workflow: ${workflow.name}` : 'Create New Workflow'
        }
        size="min(760px, 100vw)"
        className="w-full max-w-[100vw] sm:max-w-[760px]"
        position="right"
        animationType="slide"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={saveMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !name.trim()}
            >
              {saveMutation.isPending
                ? 'Saving…'
                : workflow
                  ? 'Save Changes'
                  : 'Create Workflow'}
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-5 p-1">
          {/* Basic Configuration Section */}
          <div className="space-y-4 rounded-xl border border-border/70 bg-card/60 p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Workflow Name <span className="text-destructive">*</span>
                </label>
                <Input
                  placeholder="e.g. Editorial Review Pipeline"
                  value={name}
                  onChange={(e: unknown) => {
                    const val =
                      typeof e === 'string'
                        ? e
                        : ((e as React.ChangeEvent<HTMLInputElement>)?.target
                            ?.value ?? '');
                    setName(val);
                  }}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Default Pipeline
                </label>
                <div className="flex items-center gap-3 pt-2">
                  <Switch
                    checked={isDefault}
                    onCheckedChange={handleDefaultToggle}
                    id="workflow-default"
                    aria-label="Apply automatically to new content types"
                  />
                  <label
                    onClick={() => handleDefaultToggle(!isDefault)}
                    className="text-xs text-muted-foreground cursor-pointer select-none"
                  >
                    Apply automatically to new content types
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Description
              </label>
              <Input
                placeholder="Describe the review requirements, stages, and team responsibilities..."
                value={description}
                onChange={(e: unknown) => {
                  const val =
                    typeof e === 'string'
                      ? e
                      : ((e as React.ChangeEvent<HTMLInputElement>)?.target
                          ?.value ?? '');
                  setDescription(val);
                }}
              />
            </div>
          </div>

          {/* Builder Tab Navigation (ignix-ui Tabs) */}
          <div className="w-full">
            <Tabs
              options={[
                `Stages (${stages.length})`,
                `Transitions (${transitions.length})`,
                `Assigned Content Types (${selectedSchemaIds.length})`,
              ]}
              selected={['stages', 'transitions', 'schemas'].indexOf(activeTab)}
              value={(idx: number) => {
                const keys = ['stages', 'transitions', 'schemas'] as const;
                setActiveTab(keys[idx] ?? 'stages');
              }}
              variant="underline"
              size="sm"
              className="w-full border-b border-border/60"
            />
          </div>

          {/* Tab 1: Stages Configuration */}
          {activeTab === 'stages' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-foreground">
                    Lifecycle Stages
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Sequential steps entries progress through from creation to
                    publication.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addStage}
                    className="gap-1.5 text-xs font-medium cursor-pointer"
                  >
                    <Plus className="size-3.5" />
                    <span>Add Stage</span>
                  </Button>
                </div>
              </div>

              {stages.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 rounded-xl border border-dashed border-border bg-card/40 text-center">
                  <p className="text-xs font-medium text-foreground">
                    No stages configured yet
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1 mb-3">
                    Add stages to define the lifecycle steps content moves
                    through.
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={addStage}
                      className="text-xs gap-1.5 cursor-pointer"
                    >
                      <Plus className="size-3.5" />
                      <span>Add First Stage</span>
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={handleLoadTemplate}
                      className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      Load Standard Template
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {stages.map((stage, idx) => {
                    const isFirst = !!stage.isInitial;
                    const isLast = !!stage.isFinal;

                    return (
                      <div
                        key={stage.id || idx}
                        className="p-3.5 rounded-xl border border-border/70 bg-card/70 flex flex-col gap-3 transition-colors hover:border-border"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="size-5 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-[10px] font-bold shrink-0">
                              {idx + 1}
                            </span>
                            <input
                              type="text"
                              value={stage.name}
                              onChange={(e) =>
                                updateStage(idx, {
                                  name: e.target.value,
                                  slug: slugify(e.target.value),
                                })
                              }
                              className="h-8 w-full max-w-[220px] rounded-md border border-border/80 bg-background px-2.5 py-1 text-xs font-semibold text-foreground shadow-2xs focus:outline-none focus:ring-1 focus:ring-primary"
                              placeholder="Stage name"
                            />
                            <span className="text-[11px] font-mono text-muted-foreground truncate hidden sm:inline">
                              ({stage.slug})
                            </span>
                            {isFirst && (
                              <Badge
                                variant="outline"
                                size="sm"
                                className="text-[10px] text-slate-700 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700"
                              >
                                Initial
                              </Badge>
                            )}
                            {isLast && (
                              <Badge
                                variant="outline"
                                size="sm"
                                className="text-[10px] text-emerald-700 bg-emerald-500/10 border-emerald-500/30 flex items-center gap-1"
                              >
                                <CheckCircle2 className="size-2.5" />
                                <span>Publish</span>
                              </Badge>
                            )}
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeStage(idx)}
                            className="size-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                            aria-label={`Remove stage ${stage.name}`}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>

                        {/* Stage Behavior Selector */}
                        <div className="flex items-center gap-2 pt-2 border-t border-border/40 flex-wrap">
                          <span className="text-[11px] font-medium text-muted-foreground mr-1">
                            Behavior:
                          </span>
                          <div className="inline-flex rounded-lg border border-border/60 p-0.5 bg-muted/20 gap-0.5">
                            <button
                              type="button"
                              onClick={() =>
                                updateStage(idx, {
                                  isInitial: true,
                                  isFinal: false,
                                })
                              }
                              className={cn(
                                'px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer',
                                isFirst
                                  ? 'bg-background text-foreground shadow-2xs font-semibold border border-border/60'
                                  : 'text-muted-foreground hover:text-foreground',
                              )}
                            >
                              Initial
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                updateStage(idx, {
                                  isInitial: false,
                                  isFinal: false,
                                })
                              }
                              className={cn(
                                'px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer',
                                !isFirst && !isLast
                                  ? 'bg-blue-500/15 text-blue-700 dark:text-blue-300 font-semibold border border-blue-500/40 shadow-2xs'
                                  : 'text-muted-foreground hover:text-foreground',
                              )}
                            >
                              Review & Approval
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                updateStage(idx, {
                                  isInitial: false,
                                  isFinal: true,
                                })
                              }
                              className={cn(
                                'px-2.5 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer',
                                isLast
                                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-500/40 shadow-2xs'
                                  : 'text-muted-foreground hover:text-foreground',
                              )}
                            >
                              <CheckCircle2 className="size-3 text-emerald-600 dark:text-emerald-400" />
                              <span>Publish Stage</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Transitions & Role Authority with ignix-ui Dropdowns */}
          {activeTab === 'transitions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-foreground">
                    Allowed Stage Transitions
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Configure allowed movements between stages and permitted
                    role authorities.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addTransition}
                  className="gap-1.5 text-xs font-medium"
                >
                  <Plus className="size-3.5" />
                  <span>Add Transition</span>
                </Button>
              </div>

              {stages.length < 2 ? (
                <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground text-xs">
                  Add at least two stages in the Stages tab before configuring
                  transitions.
                </div>
              ) : transitions.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 rounded-xl border border-dashed border-border bg-card/40 text-center">
                  <p className="text-xs font-medium text-foreground">
                    No transitions configured yet
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1 mb-3">
                    Connect stages together to establish allowed editorial
                    movements.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addTransition}
                    className="gap-1.5 text-xs font-medium cursor-pointer"
                  >
                    <Plus className="size-3.5" />
                    <span>Add Transition</span>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {transitions.map((transition, tIdx) => (
                    <div
                      key={transition.id || tIdx}
                      className="p-4 rounded-xl border border-border/70 bg-card/70 flex flex-col gap-3.5 hover:border-border transition-colors"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-foreground">
                            {transition.name || 'Untitled Transition'}
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTransition(tIdx)}
                          className="size-7 p-0 text-destructive hover:bg-destructive/10"
                          aria-label={`Remove transition ${transition.name}`}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1 w-full min-w-0">
                          <label className="text-[11px] font-medium text-muted-foreground block">
                            Button Action Label
                          </label>
                          <input
                            type="text"
                            value={transition.name}
                            onChange={(e) =>
                              updateTransition(tIdx, { name: e.target.value })
                            }
                            className="h-8 w-full rounded-md border border-border/80 bg-background px-2.5 py-1 text-xs text-foreground shadow-2xs focus:outline-none focus:ring-1 focus:ring-primary"
                            placeholder="e.g. Approve Content"
                          />
                        </div>

                        {/* Official ignix-ui Dropdown for From Stage */}
                        <div className="space-y-1 w-full min-w-0">
                          <label className="text-[11px] font-medium text-muted-foreground block">
                            From Stage
                          </label>
                          <Dropdown
                            trigger={
                              <button
                                type="button"
                                className="flex h-8 w-full items-center justify-between rounded-md border border-border/80 bg-background px-2.5 py-1 text-xs text-foreground shadow-2xs hover:bg-muted/40 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                              >
                                <span className="truncate">
                                  {stages.find(
                                    (s) => s.slug === transition.fromStage,
                                  )?.name || transition.fromStage}
                                </span>
                                <ChevronDown className="size-3 text-muted-foreground shrink-0 ml-1.5" />
                              </button>
                            }
                          >
                            {stages.map((s) => (
                              <DropdownItem
                                key={s.slug}
                                onSelect={() =>
                                  updateTransition(tIdx, { fromStage: s.slug })
                                }
                                className={cn(
                                  'text-xs cursor-pointer',
                                  transition.fromStage === s.slug &&
                                    'bg-primary/10 text-primary font-medium',
                                )}
                              >
                                {s.name}
                              </DropdownItem>
                            ))}
                          </Dropdown>
                        </div>

                        {/* Official ignix-ui Dropdown for To Stage */}
                        <div className="space-y-1 w-full min-w-0">
                          <label className="text-[11px] font-medium text-muted-foreground block">
                            To Stage
                          </label>
                          <Dropdown
                            trigger={
                              <button
                                type="button"
                                className="flex h-8 w-full items-center justify-between rounded-md border border-border/80 bg-background px-2.5 py-1 text-xs text-foreground shadow-2xs hover:bg-muted/40 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                              >
                                <span className="truncate">
                                  {stages.find(
                                    (s) => s.slug === transition.toStage,
                                  )?.name || transition.toStage}
                                </span>
                                <ChevronDown className="size-3 text-muted-foreground shrink-0 ml-1.5" />
                              </button>
                            }
                          >
                            {stages.map((s) => (
                              <DropdownItem
                                key={s.slug}
                                onSelect={() =>
                                  updateTransition(tIdx, { toStage: s.slug })
                                }
                                className={cn(
                                  'text-xs cursor-pointer',
                                  transition.toStage === s.slug &&
                                    'bg-primary/10 text-primary font-medium',
                                )}
                              >
                                {s.name}
                              </DropdownItem>
                            ))}
                          </Dropdown>
                        </div>
                      </div>

                      {/* Scalable Authorized Roles Selector */}
                      <div className="space-y-1.5 pt-1 border-t border-border/40">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                            <Shield className="size-3 text-primary" />
                            <span>Authorized Roles</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground">
                            {(transition.requiredRoleIds?.length ?? 0) === 0
                              ? 'All editors allowed'
                              : `${transition.requiredRoleIds?.length} role${(transition.requiredRoleIds?.length ?? 0) > 1 ? 's' : ''} assigned`}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          {transition.requiredRoleIds?.map((roleName) => (
                            <span
                              key={roleName}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-primary/10 text-primary border border-primary/25"
                            >
                              <span>{roleName}</span>
                              <button
                                type="button"
                                onClick={() =>
                                  toggleTransitionRole(tIdx, roleName)
                                }
                                className="text-primary/70 hover:text-primary cursor-pointer p-0.5 -mr-0.5 rounded hover:bg-primary/10"
                                title={`Remove ${roleName}`}
                              >
                                <X className="size-3" />
                              </button>
                            </span>
                          ))}

                          <Dropdown
                            trigger={
                              <button
                                type="button"
                                className="inline-flex h-7 items-center gap-1 px-2 rounded-md border border-dashed border-border/80 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors cursor-pointer"
                              >
                                <Plus className="size-3" />
                                <span>Assign Role</span>
                                <ChevronDown className="size-2.5 opacity-60 ml-0.5" />
                              </button>
                            }
                          >
                            {availableRoles.map((role) => {
                              const isAssigned =
                                transition.requiredRoleIds?.includes(
                                  role.name,
                                ) ||
                                transition.requiredRoleIds?.includes(role.id);
                              return (
                                <DropdownItem
                                  key={role.id}
                                  onSelect={() =>
                                    toggleTransitionRole(tIdx, role.name)
                                  }
                                  className={cn(
                                    'text-xs cursor-pointer flex items-center justify-between gap-4 py-1.5',
                                    isAssigned &&
                                      'bg-primary/10 text-primary font-medium',
                                  )}
                                >
                                  <span>{role.name}</span>
                                  {isAssigned && (
                                    <Check className="size-3 text-primary shrink-0" />
                                  )}
                                </DropdownItem>
                              );
                            })}
                          </Dropdown>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Governed Content Types (with exclusivity protection) */}
          {activeTab === 'schemas' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h4 className="text-sm font-semibold text-foreground">
                    Governed Content Types
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Content types assigned here will strictly adhere to this
                    editorial pipeline.
                  </p>
                </div>
                <div className="text-xs text-muted-foreground font-medium shrink-0">
                  <span className="text-foreground font-semibold">
                    {selectedSchemaIds.length}
                  </span>{' '}
                  of {availableSchemas.length} selected
                </div>
              </div>

              {/* Note on exclusivity */}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Lock className="size-3 text-muted-foreground shrink-0" />
                <span>Already assigned content types are locked.</span>
              </div>

              {availableSchemas.length > 0 && (
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none z-10" />
                    <input
                      type="text"
                      value={schemaSearch}
                      onChange={(e) => setSchemaSearch(e.target.value)}
                      placeholder="Search content types..."
                      className="block h-9 w-full rounded-md border border-input bg-background pl-8 pr-3 text-xs text-foreground shadow-2xs focus:outline-none focus:ring-1 focus:ring-primary box-border"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAllAvailable}
                    className="h-9 px-3 text-xs shrink-0 cursor-pointer box-border"
                    disabled={availableSelectableSchemas.length === 0}
                  >
                    {availableSelectableSchemas.length > 0 &&
                    availableSelectableSchemas.every((s) =>
                      selectedSchemaIds.includes(s.id),
                    )
                      ? 'Deselect All'
                      : 'Select All'}
                  </Button>
                </div>
              )}

              {availableSchemas.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground border border-dashed rounded-xl">
                  No content types found. Create content types first in the
                  Content Type Builder.
                </div>
              ) : filteredSchemas.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground border border-dashed rounded-xl">
                  No content types match &quot;{schemaSearch}&quot;
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
                  {filteredSchemas.map((schema) => {
                    const owner = schemaOwnershipMap.get(schema.id);
                    const isAssignedToOther =
                      owner && owner.workflowId !== workflow?.id;
                    const isChecked = selectedSchemaIds.includes(schema.id);

                    if (isAssignedToOther) {
                      return (
                        <div
                          key={schema.id}
                          className="p-3.5 rounded-xl border border-border/40 bg-muted/10 opacity-75 flex items-center justify-between cursor-not-allowed"
                          title={`Governed by "${owner.workflowName}"`}
                        >
                          <div className="space-y-1">
                            <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                              <Lock className="size-3 text-muted-foreground" />
                              <span>{schema.name}</span>
                            </div>
                            <Badge
                              variant="outline"
                              size="sm"
                              className="text-[10px] text-amber-600 bg-amber-500/10 border-amber-500/20"
                            >
                              Governed by {owner.workflowName}
                            </Badge>
                          </div>
                          <Checkbox checked={false} disabled />
                        </div>
                      );
                    }

                    return (
                      <div
                        key={schema.id}
                        onClick={() => toggleSchema(schema.id)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-colors flex items-center justify-between ${
                          isChecked
                            ? 'bg-primary/5 border-primary text-foreground shadow-2xs'
                            : 'bg-card/70 border-border/60 hover:border-border text-muted-foreground'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="text-xs font-semibold text-foreground">
                            {schema.name}
                          </div>
                          <div className="text-[11px] font-mono text-muted-foreground">
                            {schema.slug}
                          </div>
                        </div>
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center"
                        >
                          <Checkbox
                            checked={isChecked}
                            onChange={() => toggleSchema(schema.id)}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </Drawer>

      <ConfirmDialog
        open={isDefaultConfirmOpen}
        onOpenChange={setIsDefaultConfirmOpen}
        title="Replace Default Pipeline?"
        description={`"${existingDefaultWorkflow?.name}" is currently the default pipeline. Making this workflow default will replace it as the fallback for all unassigned content types.`}
        confirmLabel="Replace Default"
        cancelLabel="Keep Current"
        overlayClassName="z-[1100]"
        onConfirm={() => {
          setIsDefault(true);
          setIsDefaultConfirmOpen(false);
        }}
      />
    </>
  );
}
