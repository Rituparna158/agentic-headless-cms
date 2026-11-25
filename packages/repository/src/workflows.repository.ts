import { eq, ne, sql, and, inArray, desc, isNull } from 'drizzle-orm';
import type {
  BaseQueryOptions,
  CreateWorkflowInput,
  UpdateWorkflowInput,
  WorkflowRecord,
  ContentWorkflowStateRecord,
  WorkflowHistoryRecord,
  PendingReviewItem,
  PendingReviewsResult,
} from '@repo/types';
import { getDatabaseAdapter } from '@repo/config';
import { logger } from '@repo/logger';
import {
  workflows,
  schemaWorkflows,
  schemas,
  contentWorkflowStates,
  workflowHistories,
  contentEntries,
  entryLocalizations,
  users,
  RecordNotFoundError,
  buildPaginationOptions,
  withTransaction,
} from '@repo/shared-db';
import { ApiError } from '@repo/utils';
import { REPO_ERRORS } from './error-constants.js';

export class WorkflowsRepository {
  private get db() {
    return getDatabaseAdapter().getDb();
  }

  async list(options: BaseQueryOptions = {}, applicationId?: string) {
    try {
      logger.info('WorkflowsRepository: listing workflows');
      const { limit, offset, orderBy, where } = buildPaginationOptions(
        options,
        {
          id: workflows.id,
          name: workflows.name,
          isDefault: workflows.isDefault,
          createdAt: workflows.createdAt,
          updatedAt: workflows.updatedAt,
        },
        [workflows.name, workflows.description],
      );

      const finalWhere = applicationId
        ? where
          ? and(where, eq(workflows.applicationId, applicationId))
          : eq(workflows.applicationId, applicationId)
        : where;

      const [result, total] = await withTransaction(this.db, async (tx) => {
        const rows = await tx
          .select()
          .from(workflows)
          .where(finalWhere)
          .limit(limit)
          .offset(offset)
          .orderBy(...orderBy);

        const countResult = await tx
          .select({
            count: sql<number>`cast(count(${workflows.id}) as integer)`,
          })
          .from(workflows)
          .where(finalWhere);

        return [rows, countResult[0]?.count ?? 0] as const;
      });

      // Enrich with assigned schema IDs
      const workflowIds = result.map((w) => w.id);
      const assignmentsMap = new Map<string, string[]>();

      if (workflowIds.length > 0) {
        const assignments = await this.db
          .select({
            workflowId: schemaWorkflows.workflowId,
            schemaId: schemaWorkflows.schemaId,
          })
          .from(schemaWorkflows)
          .where(inArray(schemaWorkflows.workflowId, workflowIds));

        for (const a of assignments) {
          const list = assignmentsMap.get(a.workflowId) || [];
          list.push(a.schemaId);
          assignmentsMap.set(a.workflowId, list);
        }
      }

      const enrichedWorkflows: WorkflowRecord[] = result.map((w) => ({
        id: w.id,
        name: w.name,
        description: w.description,
        applicationId: w.applicationId,
        isDefault: w.isDefault,
        stages: w.stages,
        transitions: w.transitions,
        assignedSchemaIds: assignmentsMap.get(w.id) || [],
        createdAt: w.createdAt,
        updatedAt: w.updatedAt,
      }));

      logger.debug(
        { count: enrichedWorkflows.length, total },
        'WorkflowsRepository: list complete',
      );
      return [enrichedWorkflows, total] as const;
    } catch (error) {
      logger.error({ err: error }, 'WorkflowsRepository Error in list:');
      throw new ApiError(500, REPO_ERRORS.LIST_WORKFLOWS_FAILED);
    }
  }

  async findById(
    id: string,
    applicationId?: string,
  ): Promise<WorkflowRecord | null> {
    try {
      logger.info({ id }, 'WorkflowsRepository: finding workflow by id');
      const conditions = [eq(workflows.id, id)];
      if (applicationId) {
        conditions.push(eq(workflows.applicationId, applicationId));
      }

      const [record] = await this.db
        .select()
        .from(workflows)
        .where(and(...conditions))
        .limit(1);

      if (!record) {
        return null;
      }

      const assignments = await this.db
        .select({ schemaId: schemaWorkflows.schemaId })
        .from(schemaWorkflows)
        .where(eq(schemaWorkflows.workflowId, id));

      return {
        id: record.id,
        name: record.name,
        description: record.description,
        applicationId: record.applicationId,
        isDefault: record.isDefault,
        stages: record.stages,
        transitions: record.transitions,
        assignedSchemaIds: assignments.map((a) => a.schemaId),
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      };
    } catch (error) {
      logger.error(
        { err: error, id },
        'WorkflowsRepository Error in findById:',
      );
      throw new ApiError(500, REPO_ERRORS.FETCH_WORKFLOW_FAILED);
    }
  }

  async findByName(
    name: string,
    applicationId?: string,
  ): Promise<WorkflowRecord | null> {
    try {
      const conditions = [eq(workflows.name, name)];
      if (applicationId) {
        conditions.push(eq(workflows.applicationId, applicationId));
      }

      const [record] = await this.db
        .select()
        .from(workflows)
        .where(and(...conditions))
        .limit(1);

      if (!record) return null;

      const assignments = await this.db
        .select({ schemaId: schemaWorkflows.schemaId })
        .from(schemaWorkflows)
        .where(eq(schemaWorkflows.workflowId, record.id));

      return {
        id: record.id,
        name: record.name,
        description: record.description,
        applicationId: record.applicationId,
        isDefault: record.isDefault,
        stages: record.stages,
        transitions: record.transitions,
        assignedSchemaIds: assignments.map((a) => a.schemaId),
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      };
    } catch (error) {
      logger.error(
        { err: error, name },
        'WorkflowsRepository Error in findByName:',
      );
      throw new ApiError(500, REPO_ERRORS.FETCH_WORKFLOW_FAILED);
    }
  }

  async create(
    data: CreateWorkflowInput,
    applicationId?: string,
  ): Promise<WorkflowRecord> {
    try {
      logger.info(
        { name: data.name },
        'WorkflowsRepository: creating workflow',
      );

      return await withTransaction(this.db, async (tx) => {
        if (data.isDefault && applicationId) {
          await tx
            .update(workflows)
            .set({ isDefault: false, updatedAt: new Date() })
            .where(eq(workflows.applicationId, applicationId));
        }

        const insertPayload: Record<string, unknown> = {
          name: data.name,
          description: data.description ?? null,
          isDefault: data.isDefault ?? false,
          stages: data.stages,
          transitions: data.transitions ?? [],
        };

        if (applicationId) {
          insertPayload.applicationId = applicationId;
        }

        const [created] = await tx
          .insert(workflows)
          .values(insertPayload as any)
          .returning();

        if (!created) {
          throw new ApiError(500, REPO_ERRORS.CREATE_WORKFLOW_FAILED);
        }

        const assignedSchemaIds: string[] = [];

        if (data.schemaIds && data.schemaIds.length > 0) {
          for (const schemaId of data.schemaIds) {
            if (applicationId) {
              await tx
                .delete(schemaWorkflows)
                .where(
                  and(
                    eq(schemaWorkflows.schemaId, schemaId),
                    eq(schemaWorkflows.applicationId, applicationId),
                  ),
                );
            } else {
              await tx
                .delete(schemaWorkflows)
                .where(eq(schemaWorkflows.schemaId, schemaId));
            }

            const schemaAssignmentValues: Record<string, unknown> = {
              workflowId: created.id,
              schemaId,
            };
            if (applicationId) {
              schemaAssignmentValues.applicationId = applicationId;
            }

            await tx
              .insert(schemaWorkflows)
              .values(schemaAssignmentValues as any);
            assignedSchemaIds.push(schemaId);
          }
        }

        return {
          id: created.id,
          name: created.name,
          description: created.description,
          applicationId: created.applicationId,
          isDefault: created.isDefault,
          stages: created.stages,
          transitions: created.transitions,
          assignedSchemaIds,
          createdAt: created.createdAt,
          updatedAt: created.updatedAt,
        };
      });
    } catch (error) {
      logger.error({ err: error }, 'WorkflowsRepository Error in create:');
      throw new ApiError(500, REPO_ERRORS.CREATE_WORKFLOW_FAILED);
    }
  }

  async update(
    id: string,
    data: UpdateWorkflowInput,
    applicationId?: string,
  ): Promise<WorkflowRecord> {
    try {
      logger.info({ id }, 'WorkflowsRepository: updating workflow');

      return await withTransaction(this.db, async (tx) => {
        const conditions = [eq(workflows.id, id)];
        if (applicationId) {
          conditions.push(eq(workflows.applicationId, applicationId));
        }

        const [existing] = await tx
          .select()
          .from(workflows)
          .where(and(...conditions))
          .limit(1);

        if (!existing) {
          throw new RecordNotFoundError('Workflow not found');
        }

        if (data.isDefault && applicationId) {
          await tx
            .update(workflows)
            .set({ isDefault: false, updatedAt: new Date() })
            .where(
              and(
                eq(workflows.applicationId, applicationId),
                sql`${workflows.id} != ${id}`,
              ),
            );
        }

        const updatePayload: Record<string, unknown> = {
          updatedAt: new Date(),
        };

        if (data.name !== undefined) updatePayload.name = data.name;
        if (data.description !== undefined)
          updatePayload.description = data.description;
        if (data.isDefault !== undefined)
          updatePayload.isDefault = data.isDefault;
        if (data.stages !== undefined) updatePayload.stages = data.stages;
        if (data.transitions !== undefined)
          updatePayload.transitions = data.transitions;

        const [updated] = await tx
          .update(workflows)
          .set(updatePayload)
          .where(and(...conditions))
          .returning();

        if (!updated) {
          throw new RecordNotFoundError('Workflow not found');
        }

        let assignedSchemaIds: string[] = [];

        if (data.schemaIds !== undefined) {
          await tx
            .delete(schemaWorkflows)
            .where(eq(schemaWorkflows.workflowId, id));

          for (const schemaId of data.schemaIds) {
            if (applicationId) {
              await tx
                .delete(schemaWorkflows)
                .where(
                  and(
                    eq(schemaWorkflows.schemaId, schemaId),
                    eq(schemaWorkflows.applicationId, applicationId),
                  ),
                );
            } else {
              await tx
                .delete(schemaWorkflows)
                .where(eq(schemaWorkflows.schemaId, schemaId));
            }

            const schemaAssignmentValues: Record<string, unknown> = {
              workflowId: id,
              schemaId,
            };
            if (applicationId) {
              schemaAssignmentValues.applicationId = applicationId;
            }

            await tx
              .insert(schemaWorkflows)
              .values(schemaAssignmentValues as any);
            assignedSchemaIds.push(schemaId);
          }
        } else {
          const currentAssignments = await tx
            .select({ schemaId: schemaWorkflows.schemaId })
            .from(schemaWorkflows)
            .where(eq(schemaWorkflows.workflowId, id));
          assignedSchemaIds = currentAssignments.map((a) => a.schemaId);
        }

        return {
          id: updated.id,
          name: updated.name,
          description: updated.description,
          applicationId: updated.applicationId,
          isDefault: updated.isDefault,
          stages: updated.stages,
          transitions: updated.transitions,
          assignedSchemaIds,
          createdAt: updated.createdAt,
          updatedAt: updated.updatedAt,
        };
      });
    } catch (error) {
      if (error instanceof RecordNotFoundError) throw error;
      logger.error({ err: error, id }, 'WorkflowsRepository Error in update:');
      throw new ApiError(500, REPO_ERRORS.UPDATE_WORKFLOW_FAILED);
    }
  }

  async delete(id: string, applicationId?: string): Promise<boolean> {
    try {
      logger.info({ id }, 'WorkflowsRepository: deleting workflow');
      const conditions = [eq(workflows.id, id)];
      if (applicationId) {
        conditions.push(eq(workflows.applicationId, applicationId));
      }

      const result = await this.db
        .delete(workflows)
        .where(and(...conditions))
        .returning({ id: workflows.id });

      if (result.length === 0) {
        throw new RecordNotFoundError('Workflow not found');
      }

      return true;
    } catch (error) {
      if (error instanceof RecordNotFoundError) throw error;
      logger.error({ err: error, id }, 'WorkflowsRepository Error in delete:');
      throw new ApiError(500, REPO_ERRORS.DELETE_WORKFLOW_FAILED);
    }
  }

  async assignToSchema(
    workflowId: string,
    schemaId: string,
    applicationId?: string,
  ): Promise<void> {
    try {
      logger.info(
        { workflowId, schemaId },
        'WorkflowsRepository: assigning workflow to schema',
      );

      await withTransaction(this.db, async (tx) => {
        const workflowConditions = [eq(workflows.id, workflowId)];
        if (applicationId) {
          workflowConditions.push(eq(workflows.applicationId, applicationId));
        }
        const [wf] = await tx
          .select()
          .from(workflows)
          .where(and(...workflowConditions))
          .limit(1);

        if (!wf) {
          throw new RecordNotFoundError('Workflow not found');
        }

        const schemaConditions = [eq(schemas.id, schemaId)];
        if (applicationId) {
          schemaConditions.push(eq(schemas.applicationId, applicationId));
        }
        const [sc] = await tx
          .select()
          .from(schemas)
          .where(and(...schemaConditions))
          .limit(1);

        if (!sc) {
          throw new RecordNotFoundError('Schema not found');
        }

        const deleteConditions = [eq(schemaWorkflows.schemaId, schemaId)];
        if (applicationId) {
          deleteConditions.push(
            eq(schemaWorkflows.applicationId, applicationId),
          );
        }
        await tx.delete(schemaWorkflows).where(and(...deleteConditions));

        const insertPayload: Record<string, unknown> = {
          workflowId,
          schemaId,
        };
        if (applicationId) {
          insertPayload.applicationId = applicationId;
        }

        await tx.insert(schemaWorkflows).values(insertPayload as any);
      });
    } catch (error) {
      if (error instanceof RecordNotFoundError) throw error;
      logger.error(
        { err: error, workflowId, schemaId },
        'WorkflowsRepository Error in assignToSchema:',
      );
      throw new ApiError(500, REPO_ERRORS.ASSIGN_WORKFLOW_FAILED);
    }
  }

  async removeFromSchema(
    schemaId: string,
    applicationId?: string,
  ): Promise<void> {
    try {
      logger.info(
        { schemaId },
        'WorkflowsRepository: removing workflow from schema',
      );

      const conditions = [eq(schemaWorkflows.schemaId, schemaId)];
      if (applicationId) {
        conditions.push(eq(schemaWorkflows.applicationId, applicationId));
      }

      await this.db.delete(schemaWorkflows).where(and(...conditions));
    } catch (error) {
      logger.error(
        { err: error, schemaId },
        'WorkflowsRepository Error in removeFromSchema:',
      );
      throw new ApiError(500, REPO_ERRORS.REMOVE_WORKFLOW_ASSIGNMENT_FAILED);
    }
  }

  async getWorkflowBySchemaId(
    schemaId: string,
    applicationId?: string,
  ): Promise<WorkflowRecord | null> {
    try {
      logger.info({ schemaId }, 'WorkflowsRepository: getWorkflowBySchemaId');

      let resolvedAppId = applicationId;
      if (!resolvedAppId) {
        const [sc] = await this.db
          .select({ applicationId: schemas.applicationId })
          .from(schemas)
          .where(eq(schemas.id, schemaId))
          .limit(1);
        resolvedAppId = sc?.applicationId ?? undefined;
      }

      const conditions = [eq(schemaWorkflows.schemaId, schemaId)];
      if (resolvedAppId) {
        conditions.push(
          sql`(${schemaWorkflows.applicationId} = ${resolvedAppId} OR ${schemaWorkflows.applicationId} IS NULL)`,
        );
      }

      const [row] = await this.db
        .select({
          workflow: workflows,
        })
        .from(schemaWorkflows)
        .innerJoin(workflows, eq(schemaWorkflows.workflowId, workflows.id))
        .where(and(...conditions))
        .limit(1);

      if (row?.workflow) {
        const w = row.workflow;
        const assignments = await this.db
          .select({ schemaId: schemaWorkflows.schemaId })
          .from(schemaWorkflows)
          .where(eq(schemaWorkflows.workflowId, w.id));

        return {
          id: w.id,
          name: w.name,
          description: w.description,
          applicationId: w.applicationId,
          isDefault: w.isDefault,
          stages: w.stages,
          transitions: w.transitions,
          assignedSchemaIds: assignments.map((a) => a.schemaId),
          createdAt: w.createdAt,
          updatedAt: w.updatedAt,
        };
      }

      // If no schema-specific workflow, check for a default workflow for the app
      if (applicationId) {
        const [defaultWorkflow] = await this.db
          .select()
          .from(workflows)
          .where(
            and(
              eq(workflows.applicationId, applicationId),
              eq(workflows.isDefault, true),
            ),
          )
          .limit(1);

        if (defaultWorkflow) {
          const assignments = await this.db
            .select({ schemaId: schemaWorkflows.schemaId })
            .from(schemaWorkflows)
            .where(eq(schemaWorkflows.workflowId, defaultWorkflow.id));

          return {
            id: defaultWorkflow.id,
            name: defaultWorkflow.name,
            description: defaultWorkflow.description,
            applicationId: defaultWorkflow.applicationId,
            isDefault: defaultWorkflow.isDefault,
            stages: defaultWorkflow.stages,
            transitions: defaultWorkflow.transitions,
            assignedSchemaIds: assignments.map((a) => a.schemaId),
            createdAt: defaultWorkflow.createdAt,
            updatedAt: defaultWorkflow.updatedAt,
          };
        }
      }

      return null;
    } catch (error) {
      logger.error(
        { err: error, schemaId },
        'WorkflowsRepository Error in getWorkflowBySchemaId:',
      );
      throw new ApiError(500, REPO_ERRORS.FETCH_WORKFLOW_FAILED);
    }
  }

  async getAssignedSchemas(
    workflowId: string,
    applicationId?: string,
  ): Promise<{ id: string; name: string; slug: string }[]> {
    try {
      const conditions = [eq(schemaWorkflows.workflowId, workflowId)];
      if (applicationId) {
        conditions.push(eq(schemaWorkflows.applicationId, applicationId));
      }

      const rows = await this.db
        .select({
          id: schemas.id,
          name: schemas.name,
          slug: schemas.slug,
        })
        .from(schemaWorkflows)
        .innerJoin(schemas, eq(schemaWorkflows.schemaId, schemas.id))
        .where(and(...conditions));

      return rows;
    } catch (error) {
      logger.error(
        { err: error, workflowId },
        'WorkflowsRepository Error in getAssignedSchemas:',
      );
      throw new ApiError(500, REPO_ERRORS.FETCH_WORKFLOW_FAILED);
    }
  }

  async getEntryWorkflowState(
    entryId: string,
    applicationId?: string,
  ): Promise<ContentWorkflowStateRecord | null> {
    try {
      logger.info({ entryId }, 'WorkflowsRepository: getEntryWorkflowState');
      const conditions = [eq(contentWorkflowStates.entryId, entryId)];
      if (applicationId) {
        conditions.push(eq(contentWorkflowStates.applicationId, applicationId));
      }

      const [state] = await this.db
        .select()
        .from(contentWorkflowStates)
        .where(and(...conditions))
        .limit(1);

      return state ?? null;
    } catch (error) {
      logger.error(
        { err: error, entryId },
        'WorkflowsRepository Error in getEntryWorkflowState:',
      );
      throw new ApiError(500, REPO_ERRORS.FETCH_WORKFLOW_STATE_FAILED);
    }
  }

  async upsertEntryWorkflowState(
    data: {
      entryId: string;
      workflowId: string;
      currentStage: string;
      requiresReview?: boolean;
      updatedByUserId?: string | null;
    },
    applicationId?: string,
  ): Promise<ContentWorkflowStateRecord> {
    try {
      logger.info(
        { entryId: data.entryId, stage: data.currentStage },
        'WorkflowsRepository: upsertEntryWorkflowState',
      );

      return await withTransaction(this.db, async (tx) => {
        let resolvedAppId = applicationId;
        if (!resolvedAppId) {
          const [entryRow] = await tx
            .select({ applicationId: contentEntries.applicationId })
            .from(contentEntries)
            .where(eq(contentEntries.id, data.entryId))
            .limit(1);
          resolvedAppId = entryRow?.applicationId ?? undefined;
        }

        const conditions = [eq(contentWorkflowStates.entryId, data.entryId)];
        if (resolvedAppId) {
          conditions.push(
            sql`(${contentWorkflowStates.applicationId} = ${resolvedAppId} OR ${contentWorkflowStates.applicationId} IS NULL)`,
          );
        }

        const [existing] = await tx
          .select()
          .from(contentWorkflowStates)
          .where(and(...conditions))
          .limit(1);

        if (existing) {
          const [updated] = await tx
            .update(contentWorkflowStates)
            .set({
              workflowId: data.workflowId,
              currentStage: data.currentStage,
              updatedByUserId: data.updatedByUserId ?? null,
              updatedAt: new Date(),
              ...(typeof data.requiresReview === 'boolean'
                ? { requiresReview: data.requiresReview }
                : {}),
            })
            .where(eq(contentWorkflowStates.id, existing.id))
            .returning();
          return updated!;
        } else {
          const [inserted] = await tx
            .insert(contentWorkflowStates)
            .values({
              entryId: data.entryId,
              workflowId: data.workflowId,
              currentStage: data.currentStage,
              requiresReview: data.requiresReview ?? true,
              updatedByUserId: data.updatedByUserId ?? null,
              ...(resolvedAppId ? { applicationId: resolvedAppId } : {}),
            })
            .returning();
          return inserted!;
        }
      });
    } catch (error) {
      logger.error(
        { err: error, entryId: data.entryId },
        'WorkflowsRepository Error in upsertEntryWorkflowState:',
      );
      throw new ApiError(500, REPO_ERRORS.UPDATE_WORKFLOW_STATE_FAILED);
    }
  }

  async setEntryWorkflowMode(
    entryId: string,
    requiresReview: boolean,
    userId?: string,
    applicationId?: string,
  ): Promise<ContentWorkflowStateRecord | null> {
    try {
      logger.info(
        { entryId, requiresReview },
        'WorkflowsRepository: setEntryWorkflowMode',
      );

      let resolvedAppId = applicationId;
      if (!resolvedAppId) {
        const [entryRow] = await this.db
          .select({ applicationId: contentEntries.applicationId })
          .from(contentEntries)
          .where(eq(contentEntries.id, entryId))
          .limit(1);
        resolvedAppId = entryRow?.applicationId ?? undefined;
      }

      const conditions = [eq(contentWorkflowStates.entryId, entryId)];
      if (resolvedAppId) {
        conditions.push(
          sql`(${contentWorkflowStates.applicationId} = ${resolvedAppId} OR ${contentWorkflowStates.applicationId} IS NULL)`,
        );
      }

      const [existing] = await this.db
        .select()
        .from(contentWorkflowStates)
        .where(and(...conditions))
        .limit(1);

      if (!existing) {
        return null;
      }

      const [updated] = await this.db
        .update(contentWorkflowStates)
        .set({
          requiresReview,
          updatedByUserId: userId ?? existing.updatedByUserId,
          updatedAt: new Date(),
        })
        .where(eq(contentWorkflowStates.id, existing.id))
        .returning();

      return updated ?? null;
    } catch (error) {
      logger.error(
        { err: error, entryId, requiresReview },
        'WorkflowsRepository Error in setEntryWorkflowMode:',
      );
      throw new ApiError(500, REPO_ERRORS.UPDATE_WORKFLOW_STATE_FAILED);
    }
  }

  async recordWorkflowHistory(
    data: {
      entryId: string;
      workflowId: string;
      fromStage: string;
      toStage: string;
      action?: string;
      comment?: string;
      actorType?: 'user' | 'agent' | 'system';
      actorUserId?: string | null;
    },
    applicationId?: string,
  ): Promise<WorkflowHistoryRecord> {
    try {
      logger.info(
        { entryId: data.entryId, from: data.fromStage, to: data.toStage },
        'WorkflowsRepository: recordWorkflowHistory',
      );

      let resolvedAppId = applicationId;
      if (!resolvedAppId) {
        const [entryRow] = await this.db
          .select({ applicationId: contentEntries.applicationId })
          .from(contentEntries)
          .where(eq(contentEntries.id, data.entryId))
          .limit(1);
        resolvedAppId = entryRow?.applicationId ?? undefined;
      }

      const insertPayload: Record<string, unknown> = {
        entryId: data.entryId,
        workflowId: data.workflowId,
        fromStage: data.fromStage,
        toStage: data.toStage,
        action: data.action ?? 'transition',
        comment: data.comment ?? null,
        actorType: data.actorType ?? 'user',
        actorUserId: data.actorUserId ?? null,
      };
      if (resolvedAppId) {
        insertPayload.applicationId = resolvedAppId;
      }

      const [record] = await this.db
        .insert(workflowHistories)
        .values(insertPayload as any)
        .returning();

      return record!;
    } catch (error) {
      logger.error(
        { err: error, entryId: data.entryId },
        'WorkflowsRepository Error in recordWorkflowHistory:',
      );
      throw new ApiError(500, REPO_ERRORS.RECORD_WORKFLOW_HISTORY_FAILED);
    }
  }

  async hasUnapprovedDraftEdits(
    entryId: string,
    workflowStateUpdatedAt?: string | Date | null,
    applicationId?: string,
  ): Promise<boolean> {
    try {
      const conditions = [eq(entryLocalizations.entryId, entryId)];
      if (applicationId) {
        conditions.push(
          sql`(${entryLocalizations.applicationId} = ${applicationId} OR ${entryLocalizations.applicationId} IS NULL)`,
        );
      }

      const [loc] = await this.db
        .select({
          status: entryLocalizations.status,
          updatedAt: entryLocalizations.updatedAt,
        })
        .from(entryLocalizations)
        .where(and(...conditions))
        .orderBy(desc(entryLocalizations.updatedAt))
        .limit(1);

      if (!loc || loc.status !== 'draft') {
        return false;
      }

      if (!workflowStateUpdatedAt) {
        return true;
      }

      return (
        new Date(loc.updatedAt).getTime() >
        new Date(workflowStateUpdatedAt).getTime()
      );
    } catch {
      return false;
    }
  }

  async getEntryRejectionInfo(
    entryId: string,
    initialStageSlug: string = 'draft',
    applicationId?: string,
  ): Promise<{
    hasRequestedChanges: boolean;
    rejectionComment?: string | null;
    rejectedAt?: Date | null;
    hasDraftSavedSinceRejection: boolean;
  }> {
    try {
      const conditions = [eq(workflowHistories.entryId, entryId)];
      if (applicationId) {
        conditions.push(
          sql`(${workflowHistories.applicationId} = ${applicationId} OR ${workflowHistories.applicationId} IS NULL)`,
        );
      }

      const [lastRejection] = await this.db
        .select({
          action: workflowHistories.action,
          fromStage: workflowHistories.fromStage,
          toStage: workflowHistories.toStage,
          comment: workflowHistories.comment,
          createdAt: workflowHistories.createdAt,
        })
        .from(workflowHistories)
        .where(
          and(
            ...conditions,
            eq(workflowHistories.toStage, initialStageSlug),
            ne(workflowHistories.fromStage, initialStageSlug),
            sql`(LOWER(${workflowHistories.action}) LIKE '%request%change%' OR LOWER(${workflowHistories.action}) LIKE '%reject%' OR LOWER(${workflowHistories.fromStage}) LIKE '%review%')`,
            sql`LOWER(${workflowHistories.action}) NOT LIKE '%mode%'`,
            sql`LOWER(${workflowHistories.action}) NOT LIKE '%publish%'`,
            sql`COALESCE(LOWER(${workflowHistories.comment}), '') NOT LIKE '%review mode%'`,
            sql`COALESCE(LOWER(${workflowHistories.comment}), '') NOT LIKE '%publishing mode%'`,
          ),
        )
        .orderBy(desc(workflowHistories.createdAt))
        .limit(1);

      if (!lastRejection) {
        return {
          hasRequestedChanges: false,
          hasDraftSavedSinceRejection: true,
        };
      }

      const locConditions = [eq(entryLocalizations.entryId, entryId)];
      if (applicationId) {
        locConditions.push(
          sql`(${entryLocalizations.applicationId} = ${applicationId} OR ${entryLocalizations.applicationId} IS NULL)`,
        );
      }

      const [loc] = await this.db
        .select({ updatedAt: entryLocalizations.updatedAt })
        .from(entryLocalizations)
        .where(and(...locConditions))
        .orderBy(desc(entryLocalizations.updatedAt))
        .limit(1);

      const hasDraftSavedSinceRejection =
        !!loc?.updatedAt &&
        new Date(loc.updatedAt).getTime() >
          new Date(lastRejection.createdAt).getTime();

      return {
        hasRequestedChanges: true,
        rejectionComment: lastRejection.comment,
        rejectedAt: lastRejection.createdAt
          ? new Date(lastRejection.createdAt)
          : null,
        hasDraftSavedSinceRejection,
      };
    } catch (err) {
      logger.error(
        { err, entryId },
        'WorkflowsRepository: getEntryRejectionInfo failed',
      );
      return {
        hasRequestedChanges: false,
        hasDraftSavedSinceRejection: true,
      };
    }
  }

  async getWorkflowHistory(
    entryId: string,
    applicationId?: string,
  ): Promise<
    (WorkflowHistoryRecord & {
      actorName?: string | null;
      actorEmail?: string | null;
    })[]
  > {
    try {
      logger.info({ entryId }, 'WorkflowsRepository: getWorkflowHistory');

      const conditions = [eq(workflowHistories.entryId, entryId)];
      if (applicationId) {
        conditions.push(eq(workflowHistories.applicationId, applicationId));
      }

      const rows = await this.db
        .select({
          history: workflowHistories,
          user: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
          },
        })
        .from(workflowHistories)
        .leftJoin(users, eq(workflowHistories.actorUserId, users.id))
        .where(and(...conditions))
        .orderBy(desc(workflowHistories.createdAt));

      return rows.map((r) => {
        const actorName = r.user?.firstName
          ? `${r.user.firstName}${r.user.lastName ? ` ${r.user.lastName}` : ''}`
          : (r.user?.email ?? null);
        return {
          ...r.history,
          actorName,
          actorEmail: r.user?.email ?? null,
        };
      });
    } catch (error) {
      logger.error(
        { err: error, entryId },
        'WorkflowsRepository Error in getWorkflowHistory:',
      );
      throw new ApiError(500, REPO_ERRORS.FETCH_WORKFLOW_HISTORY_FAILED);
    }
  }

  async getEntryCreatorUserId(
    entryId: string,
    applicationId?: string,
  ): Promise<string | null> {
    try {
      logger.info({ entryId }, 'WorkflowsRepository: getEntryCreatorUserId');
      const conditions = [eq(contentEntries.id, entryId)];
      if (applicationId) {
        conditions.push(eq(contentEntries.applicationId, applicationId));
      }

      const [entry] = await this.db
        .select({ createdByUserId: contentEntries.createdByUserId })
        .from(contentEntries)
        .where(and(...conditions))
        .limit(1);

      return entry?.createdByUserId ?? null;
    } catch (error) {
      logger.error(
        { err: error, entryId },
        'WorkflowsRepository Error in getEntryCreatorUserId:',
      );
      return null;
    }
  }

  async getEntryWorkflowActors(
    entryId: string,
    applicationId?: string,
  ): Promise<{
    creator: { id: string; email?: string | null; name?: string | null } | null;
    submitter: {
      id: string;
      email?: string | null;
      name?: string | null;
    } | null;
  }> {
    try {
      logger.info({ entryId }, 'WorkflowsRepository: getEntryWorkflowActors');
      const conditions = [eq(contentEntries.id, entryId)];
      if (applicationId) {
        conditions.push(eq(contentEntries.applicationId, applicationId));
      }

      const [entryRow] = await this.db
        .select({
          creatorId: contentEntries.createdByUserId,
          creatorEmail: users.email,
          creatorFirstName: users.firstName,
          creatorLastName: users.lastName,
        })
        .from(contentEntries)
        .leftJoin(users, eq(contentEntries.createdByUserId, users.id))
        .where(and(...conditions))
        .limit(1);

      const historyConditions = [eq(workflowHistories.entryId, entryId)];
      if (applicationId) {
        historyConditions.push(
          sql`(${workflowHistories.applicationId} = ${applicationId} OR ${workflowHistories.applicationId} IS NULL)`,
        );
      }

      const [submitRow] = await this.db
        .select({
          submitterId: workflowHistories.actorUserId,
          submitterEmail: users.email,
          submitterFirstName: users.firstName,
          submitterLastName: users.lastName,
        })
        .from(workflowHistories)
        .leftJoin(users, eq(workflowHistories.actorUserId, users.id))
        .where(
          and(
            ...historyConditions,
            sql`(LOWER(${workflowHistories.action}) LIKE '%submit%' OR LOWER(${workflowHistories.toStage}) LIKE '%review%')`,
            sql`LOWER(${workflowHistories.action}) NOT LIKE '%change%'`,
            sql`LOWER(${workflowHistories.action}) NOT LIKE '%reject%'`,
          ),
        )
        .orderBy(desc(workflowHistories.createdAt))
        .limit(1);

      const creator = entryRow?.creatorId
        ? {
            id: entryRow.creatorId,
            email: entryRow.creatorEmail ?? null,
            name: entryRow.creatorFirstName
              ? `${entryRow.creatorFirstName}${entryRow.creatorLastName ? ` ${entryRow.creatorLastName}` : ''}`
              : (entryRow.creatorEmail ?? null),
          }
        : null;

      const submitter = submitRow?.submitterId
        ? {
            id: submitRow.submitterId,
            email: submitRow.submitterEmail ?? null,
            name: submitRow.submitterFirstName
              ? `${submitRow.submitterFirstName}${submitRow.submitterLastName ? ` ${submitRow.submitterLastName}` : ''}`
              : (submitRow.submitterEmail ?? null),
          }
        : creator;

      return { creator, submitter };
    } catch (error) {
      logger.error(
        { err: error, entryId },
        'WorkflowsRepository Error in getEntryWorkflowActors:',
      );
      return { creator: null, submitter: null };
    }
  }

  async countActiveEntriesInStage(
    workflowId: string,
    stageSlug: string,
    applicationId?: string,
  ): Promise<number> {
    try {
      logger.info(
        { workflowId, stageSlug },
        'WorkflowsRepository: countActiveEntriesInStage',
      );
      const conditions = [
        eq(contentWorkflowStates.workflowId, workflowId),
        sql`REPLACE(LOWER(${contentWorkflowStates.currentStage}), '-', '_') = REPLACE(LOWER(${stageSlug}), '-', '_')`,
        isNull(contentEntries.deletedAt),
      ];
      if (applicationId) {
        conditions.push(
          sql`(${contentWorkflowStates.applicationId} = ${applicationId} OR ${contentWorkflowStates.applicationId} IS NULL)`,
        );
      }

      const [res] = await this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(contentWorkflowStates)
        .innerJoin(
          contentEntries,
          eq(contentWorkflowStates.entryId, contentEntries.id),
        )
        .where(and(...conditions));

      return Number(res?.count ?? 0);
    } catch (error) {
      logger.error(
        { err: error, workflowId, stageSlug },
        'WorkflowsRepository Error in countActiveEntriesInStage:',
      );
      return 0;
    }
  }

  async countActiveEntriesForWorkflow(
    workflowId: string,
    applicationId?: string,
  ): Promise<number> {
    try {
      logger.info(
        { workflowId },
        'WorkflowsRepository: countActiveEntriesForWorkflow',
      );
      const conditions = [
        eq(contentWorkflowStates.workflowId, workflowId),
        isNull(contentEntries.deletedAt),
      ];
      if (applicationId) {
        conditions.push(eq(contentWorkflowStates.applicationId, applicationId));
      }

      const [res] = await this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(contentWorkflowStates)
        .innerJoin(
          contentEntries,
          eq(contentWorkflowStates.entryId, contentEntries.id),
        )
        .where(and(...conditions));

      return Number(res?.count ?? 0);
    } catch (error) {
      logger.error(
        { err: error, workflowId },
        'WorkflowsRepository Error in countActiveEntriesForWorkflow:',
      );
      return 0;
    }
  }

  async getPendingReviews(
    applicationId?: string,
    limit = 20,
  ): Promise<PendingReviewsResult> {
    try {
      logger.info({ applicationId }, 'WorkflowsRepository: getPendingReviews');

      const conditions = [
        isNull(contentEntries.deletedAt),
        sql`LOWER(${contentWorkflowStates.currentStage}) LIKE '%review%'`,
        sql`(${contentWorkflowStates.requiresReview} = true OR ${contentWorkflowStates.requiresReview} IS NULL)`,
      ];
      if (applicationId) {
        conditions.push(
          sql`(${contentWorkflowStates.applicationId} = ${applicationId} OR ${contentWorkflowStates.applicationId} IS NULL)`,
        );
      }

      const rows = await this.db
        .select({
          entryId: contentEntries.id,
          schemaId: contentEntries.schemaId,
          schemaName: schemas.name,
          schemaSlug: schemas.slug,
          currentStage: contentWorkflowStates.currentStage,
          workflowStages: workflows.stages,
          updatedAt: contentEntries.updatedAt,
          data: entryLocalizations.data,
          creatorUserId: contentEntries.createdByUserId,
          submitterUserId: contentWorkflowStates.updatedByUserId,
          user: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
          },
        })
        .from(contentWorkflowStates)
        .innerJoin(
          contentEntries,
          eq(contentWorkflowStates.entryId, contentEntries.id),
        )
        .innerJoin(schemas, eq(contentEntries.schemaId, schemas.id))
        .leftJoin(workflows, eq(contentWorkflowStates.workflowId, workflows.id))
        .leftJoin(users, eq(contentEntries.createdByUserId, users.id))
        .leftJoin(
          entryLocalizations,
          and(
            eq(contentEntries.id, entryLocalizations.entryId),
            eq(entryLocalizations.locale, 'en'),
          ),
        )
        .where(and(...conditions))
        .orderBy(desc(contentEntries.updatedAt))
        .limit(limit);

      const [countRow] = await this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(contentWorkflowStates)
        .innerJoin(
          contentEntries,
          eq(contentWorkflowStates.entryId, contentEntries.id),
        )
        .where(and(...conditions));

      const total = Number(countRow?.count ?? 0);

      const items: PendingReviewItem[] = rows.map((r) => {
        const stagesList =
          (r.workflowStages as Array<{
            slug: string;
            name: string;
            color?: string;
          }>) || [];
        const stageObj = stagesList.find((s) => s.slug === r.currentStage);
        const stageName =
          stageObj?.name || r.currentStage.replace(/[_-]/g, ' ');
        const stageColor = stageObj?.color || '#f59e0b';

        const dataObj = (r.data as Record<string, unknown>) || {};
        const titleKey = Object.keys(dataObj).find((k) =>
          ['title', 'name', 'headline', 'subject'].includes(k.toLowerCase()),
        );
        const title =
          titleKey && typeof dataObj[titleKey] === 'string'
            ? (dataObj[titleKey] as string)
            : `Entry ${r.entryId.slice(0, 8)}`;

        const authorName = r.user?.firstName
          ? `${r.user.firstName}${r.user.lastName ? ` ${r.user.lastName}` : ''}`
          : (r.user?.email ?? null);

        return {
          entryId: r.entryId,
          schemaId: r.schemaId,
          schemaName: r.schemaName,
          schemaSlug: r.schemaSlug,
          currentStage: r.currentStage,
          stageName,
          stageColor,
          title,
          updatedAt: r.updatedAt
            ? new Date(r.updatedAt).toISOString()
            : new Date().toISOString(),
          authorEmail: r.user?.email ?? null,
          authorName,
          creatorUserId: r.creatorUserId ?? null,
          submitterUserId: r.submitterUserId ?? null,
        };
      });

      return { total, items };
    } catch (error) {
      logger.error(
        { err: error },
        'WorkflowsRepository Error in getPendingReviews:',
      );
      return { total: 0, items: [] };
    }
  }
}
