import { eq, sql, and, inArray, desc } from 'drizzle-orm';
import type {
  BaseQueryOptions,
  CreateWorkflowInput,
  UpdateWorkflowInput,
  WorkflowRecord,
  ContentWorkflowStateRecord,
  WorkflowHistoryRecord,
} from '@repo/types';
import { getDatabaseAdapter } from '@repo/config';
import { logger } from '@repo/logger';
import {
  workflows,
  schemaWorkflows,
  schemas,
  contentWorkflowStates,
  workflowHistories,
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

      const conditions = [eq(schemaWorkflows.schemaId, schemaId)];
      if (applicationId) {
        conditions.push(eq(schemaWorkflows.applicationId, applicationId));
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
        const conditions = [eq(contentWorkflowStates.entryId, data.entryId)];
        if (applicationId) {
          conditions.push(
            eq(contentWorkflowStates.applicationId, applicationId),
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
            })
            .where(eq(contentWorkflowStates.id, existing.id))
            .returning();
          return updated!;
        } else {
          const insertPayload: Record<string, unknown> = {
            entryId: data.entryId,
            workflowId: data.workflowId,
            currentStage: data.currentStage,
            updatedByUserId: data.updatedByUserId ?? null,
          };
          if (applicationId) {
            insertPayload.applicationId = applicationId;
          }
          const [inserted] = await tx
            .insert(contentWorkflowStates)
            .values(insertPayload as any)
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
      if (applicationId) {
        insertPayload.applicationId = applicationId;
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
}
