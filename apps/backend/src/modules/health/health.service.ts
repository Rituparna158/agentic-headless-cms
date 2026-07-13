import { getDatabaseAdapter } from '../../config/database.js';
import type {
  DependencyStatus,
  ReadinessResult,
} from '../../types/health.types.js';

//Kubernetes readiness check
export async function checkReadiness(): Promise<ReadinessResult> {
  const database = await checkDatabase();

  return {
    healthy: database.status === 'up',
    dependencies: { database },
  };
}

async function checkDatabase(): Promise<DependencyStatus> {
  try {
    await getDatabaseAdapter().healthCheck(2_000);
    return { status: 'up' };
  } catch (error) {
    return {
      status: 'down',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
