import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { of, lastValueFrom } from 'rxjs';
import { TransformInterceptor, ResponseFormat } from './transform.interceptor';

describe('TransformInterceptor', () => {
  let interceptor: TransformInterceptor<unknown>;
  let reflector: Reflector;

  const createMockContext = (statusCode = 200): ExecutionContext => {
    return {
      getHandler: vi.fn(),
      getClass: vi.fn(),
      switchToHttp: () => ({
        getResponse: () => ({ statusCode }),
      }),
    } as unknown as ExecutionContext;
  };

  const createMockHandler = (data: unknown): CallHandler => ({
    handle: () => of(data),
  });

  beforeEach(() => {
    reflector = {
      getAllAndOverride: vi.fn().mockReturnValue(false),
    } as unknown as Reflector;

    interceptor = new TransformInterceptor(reflector);
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should wrap response data in standardized { success, statusCode, data, timestamp } envelope', async () => {
    const context = createMockContext(200);
    const handler = createMockHandler({ id: 'item-1', name: 'Prescription Item' });

    const result$ = interceptor.intercept(context, handler);
    const result = (await lastValueFrom(result$)) as ResponseFormat<unknown>;

    expect(result.success).toBe(true);
    expect(result.statusCode).toBe(200);
    expect(result.data).toEqual({ id: 'item-1', name: 'Prescription Item' });
    expect(result.timestamp).toBeDefined();
  });

  it('should not wrap Terminus health check responses', async () => {
    const context = createMockContext(200);
    const terminusData = {
      status: 'ok',
      info: { database: { status: 'up' } },
      error: {},
      details: { database: { status: 'up' } },
    };
    const handler = createMockHandler(terminusData);

    const result$ = interceptor.intercept(context, handler);
    const result = await lastValueFrom(result$);

    expect(result).toEqual(terminusData);
  });

  it('should pass through raw data when BYPASS_TRANSFORM is set', async () => {
    vi.mocked(reflector.getAllAndOverride).mockReturnValueOnce(true);
    const context = createMockContext(200);
    const rawData = 'raw-stream-content';
    const handler = createMockHandler(rawData);

    const result$ = interceptor.intercept(context, handler);
    const result = await lastValueFrom(result$);

    expect(result).toBe('raw-stream-content');
  });
});
