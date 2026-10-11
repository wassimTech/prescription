import { beforeAll } from 'vitest';
import { assertSafeTestEnvironment } from './helpers/db-safety-guard';

beforeAll(() => {
  assertSafeTestEnvironment();
});
