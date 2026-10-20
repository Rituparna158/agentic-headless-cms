import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';
import {
  requestHandler,
  validateResponse,
  ApiContractError,
  ApiRequestError,
  handleApiError,
} from '@/api/requestHandler';
import { apiClient } from '@/api/client';

describe('API Gateway & Contract Validation', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('validateResponse', () => {
    const testSchema = z.object({
      id: z.string(),
      count: z.number(),
    });

    it('returns parsed data when payload matches schema', () => {
      const validData = { id: 'test-1', count: 42 };
      const parsed = validateResponse(validData, testSchema, 'testEndpoint');
      expect(parsed).toEqual(validData);
    });

    it('throws ApiContractError with field details when payload violates schema', () => {
      const invalidData = { id: 123, count: 'invalid' };
      expect(() =>
        validateResponse(invalidData, testSchema, 'testEndpoint'),
      ).toThrow(ApiContractError);

      try {
        validateResponse(invalidData, testSchema, 'testEndpoint');
      } catch (err) {
        expect(err).toBeInstanceOf(ApiContractError);
        const contractErr = err as ApiContractError;
        expect(contractErr.endpointLabel).toBe('testEndpoint');
        expect(contractErr.issues.length).toBeGreaterThanOrEqual(1);
      }
    });
  });

  describe('requestHandler schema contract integration', () => {
    const responseSchema = z.object({
      name: z.string(),
      enabled: z.boolean(),
    });

    it('validates response.data.data when schema is provided', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
        data: {
          success: true,
          data: { name: 'My Collection', enabled: true },
        },
      });

      const res = await requestHandler.get('/api/test', {
        schema: responseSchema,
        endpointLabel: 'GET /api/test',
      });

      expect(res.data).toEqual({ name: 'My Collection', enabled: true });
    });

    it('throws ApiContractError if server response fails contract validation', async () => {
      vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
        data: {
          success: true,
          data: { name: 'My Collection', enabled: 'NOT_A_BOOLEAN' },
        },
      });

      await expect(
        requestHandler.get('/api/test', {
          schema: responseSchema,
          endpointLabel: 'GET /api/test',
        }),
      ).rejects.toThrow(ApiContractError);
    });
  });

  describe('requestHandler HTTP methods (POST, PUT, DELETE, PATCH)', () => {
    it('executes post request with payload and optional schema', async () => {
      vi.spyOn(apiClient, 'post').mockResolvedValueOnce({
        data: { success: true, data: { created: true } },
      });

      const res = await requestHandler.post('/api/create', { title: 'Test' });
      expect(res.data).toEqual({ created: true });
    });

    it('executes put request with payload', async () => {
      vi.spyOn(apiClient, 'put').mockResolvedValueOnce({
        data: { success: true, data: { updated: true } },
      });

      const res = await requestHandler.put('/api/update/1', {
        title: 'Updated',
      });
      expect(res.data).toEqual({ updated: true });
    });

    it('executes patch request with partial payload', async () => {
      vi.spyOn(apiClient, 'patch').mockResolvedValueOnce({
        data: { success: true, data: { patched: true } },
      });

      const res = await requestHandler.patch('/api/patch/1', {
        status: 'published',
      });
      expect(res.data).toEqual({ patched: true });
    });

    it('executes delete request', async () => {
      vi.spyOn(apiClient, 'delete').mockResolvedValueOnce({
        data: { success: true, data: null },
      });

      const res = await requestHandler.delete('/api/delete/1');
      expect(res.data).toBeNull();
    });
  });

  describe('handleApiError & cancellation', () => {
    it('marks error as isCanceled: true on CanceledError', () => {
      const canceledErr = new Error('canceled');
      canceledErr.name = 'CanceledError';

      const apiErr = handleApiError(canceledErr);
      expect(apiErr).toBeInstanceOf(ApiRequestError);
      expect((apiErr as ApiRequestError).isCanceled).toBe(true);
      expect((apiErr as ApiRequestError).status).toBe(0);
    });

    it('marks error as isCanceled: true on AbortError', () => {
      const abortErr = new Error('The user aborted a request.');
      abortErr.name = 'AbortError';

      const apiErr = handleApiError(abortErr);
      expect(apiErr).toBeInstanceOf(ApiRequestError);
      expect((apiErr as ApiRequestError).isCanceled).toBe(true);
      expect((apiErr as ApiRequestError).status).toBe(0);
    });

    it('preserves ApiContractError without converting to generic error', () => {
      const contractErr = new ApiContractError([], 'test');
      const result = handleApiError(contractErr);
      expect(result).toBe(contractErr);
    });

    it('preserves existing ApiRequestError', () => {
      const existing = new ApiRequestError('existing', 400);
      expect(handleApiError(existing)).toBe(existing);
    });

    it('normalizes axios error with response data and status', () => {
      const axiosErr = {
        isAxiosError: true,
        message: 'Request failed with status code 403',
        response: {
          status: 403,
          data: {
            error: {
              message: 'Forbidden resource',
              errors: [{ field: 'role', message: 'Insufficient role' }],
            },
          },
        },
      };

      const result = handleApiError(axiosErr) as ApiRequestError;
      expect(result).toBeInstanceOf(ApiRequestError);
      expect(result.status).toBe(403);
      expect(result.message).toBe('Forbidden resource');
      expect(result.errors).toEqual([
        { field: 'role', message: 'Insufficient role' },
      ]);
    });

    it('normalizes standard generic Error instance', () => {
      const err = new Error('Generic failure');
      const result = handleApiError(err) as ApiRequestError;
      expect(result).toBeInstanceOf(ApiRequestError);
      expect(result.message).toBe('Generic failure');
      expect(result.status).toBe(500);
    });
  });
});
