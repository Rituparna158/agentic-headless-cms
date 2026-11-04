import { describe, it, expect } from 'vitest';
import { validateWebhookUrl } from '../../../../src/modules/webhooks/webhook-validator.util.js';
import { BadRequestError } from '@repo/utils';

describe('validateWebhookUrl', () => {
  it('should accept valid public HTTPS URLs', () => {
    expect(() =>
      validateWebhookUrl('https://api.example.com/webhooks', false),
    ).not.toThrow();
  });

  it('should throw for invalid URL formats', () => {
    expect(() => validateWebhookUrl('not-a-valid-url')).toThrow(
      BadRequestError,
    );
  });

  it('should throw for non-HTTP/HTTPS protocols', () => {
    expect(() => validateWebhookUrl('ftp://example.com/resource')).toThrow(
      BadRequestError,
    );
  });

  it('should reject loopback addresses in production', () => {
    expect(() =>
      validateWebhookUrl('http://127.0.0.1:8080/hook', false),
    ).toThrow(BadRequestError);
    expect(() =>
      validateWebhookUrl('http://localhost:3000/hook', false),
    ).toThrow(BadRequestError);
  });

  it('should reject cloud metadata endpoints in production', () => {
    expect(() =>
      validateWebhookUrl('http://169.254.169.254/latest/meta-data', false),
    ).toThrow(BadRequestError);
  });

  it('should reject private RFC 1918 subnets in production', () => {
    expect(() => validateWebhookUrl('http://10.0.1.5/hook', false)).toThrow(
      BadRequestError,
    );
    expect(() => validateWebhookUrl('http://192.168.1.1/hook', false)).toThrow(
      BadRequestError,
    );
    expect(() => validateWebhookUrl('http://172.20.0.5/hook', false)).toThrow(
      BadRequestError,
    );
  });

  it('should allow localhost when allowLocal is true', () => {
    expect(() =>
      validateWebhookUrl('http://127.0.0.1:9876/hook', true),
    ).not.toThrow();
  });
});
