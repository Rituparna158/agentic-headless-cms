/**
 * Generic API Response Interface
 */
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}
