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
