import { beforeAll, afterEach, afterAll } from 'vitest';
import { server } from './mocks/server';
import { assertSafeTestEnvironment } from './helpers/db-safety-guard';

beforeAll(() => {
  assertSafeTestEnvironment();
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});
