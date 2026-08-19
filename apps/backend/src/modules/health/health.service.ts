import { getDatabaseAdapter } from '@repo/config';
import type {
  DependencyStatus,
  ReadinessResult,
} from '../../types/health.types.js';
import { ApiError } from '@repo/utils';
import { SERVICE_ERRORS } from '../../utils/error-constants.js';
// Kubernetes readiness check
export async function checkReadiness(): Promise<ReadinessResult> {
  try {
    const database = await checkDatabase();
    return {
      healthy: database.status === 'up',
      dependencies: { database },
    };
  } catch {
    throw new ApiError(500, SERVICE_ERRORS.HEALTH_CHECK_FAILED);
  }
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
