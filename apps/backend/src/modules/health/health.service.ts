import { getDatabaseClient } from '../../database/index.js';

export interface DependencyStatus {
  status: 'up' | 'down';
  message?: string;
}

export interface ReadinessResult {
  healthy: boolean;
  dependencies: {
    database: DependencyStatus;
  };
}

/** Kubernetes readiness probe target — can this instance actually serve traffic right now? */
export async function checkReadiness(): Promise<ReadinessResult> {
  const database = await checkDatabase();

  return {
    healthy: database.status === 'up',
    dependencies: { database },
  };
}

async function checkDatabase(): Promise<DependencyStatus> {
  try {
    await getDatabaseClient().healthCheck(2_000);
    return { status: 'up' };
  } catch (error) {
    return {
      status: 'down',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
