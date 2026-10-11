import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { assertSafeTestEnvironment, ProductionDatabaseViolationError } from './db-safety-guard';

describe('Database Safety Guard (Security Safeguard)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it('should pass when NODE_ENV is test and DATABASE_URL is localhost', () => {
    process.env.NODE_ENV = 'test';
    const safeUrl = 'postgresql://postgres:postgres@localhost:5433/prescription_test?schema=public';

    expect(() => assertSafeTestEnvironment(safeUrl)).not.toThrow();
  });

  it('should pass when DATABASE_URL is the docker postgres service', () => {
    process.env.NODE_ENV = 'test';
    const safeUrl = 'postgresql://postgres:postgres@postgres:5432/prescription_test?schema=public';

    expect(() => assertSafeTestEnvironment(safeUrl)).not.toThrow();
  });

  it('should pass when DATABASE_URL is undefined (pure in-memory or mocked tests)', () => {
    process.env.NODE_ENV = 'test';
    delete process.env.DATABASE_URL;

    expect(() => assertSafeTestEnvironment()).not.toThrow();
  });

  it('should throw and block execution when NODE_ENV is production', () => {
    process.env.NODE_ENV = 'production';
    const url = 'postgresql://postgres:postgres@localhost:5433/test_db';

    expect(() => assertSafeTestEnvironment(url)).toThrow(ProductionDatabaseViolationError);
  });

  it('should throw and block execution when NODE_ENV is prod', () => {
    process.env.NODE_ENV = 'prod';
    const url = 'postgresql://postgres:postgres@localhost:5433/test_db';

    expect(() => assertSafeTestEnvironment(url)).toThrow(ProductionDatabaseViolationError);
  });

  it('should throw when DATABASE_URL points to AWS RDS', () => {
    process.env.NODE_ENV = 'test';
    const awsUrl =
      'postgresql://admin:secret@prescription-prod.c123.eu-west-3.rds.amazonaws.com:5432/prescription_db';

    expect(() => assertSafeTestEnvironment(awsUrl)).toThrow(ProductionDatabaseViolationError);
  });

  it('should throw when DATABASE_URL points to Supabase', () => {
    process.env.NODE_ENV = 'test';
    const supabaseUrl = 'postgresql://postgres:secret@db.abcxyz.supabase.co:5432/postgres';

    expect(() => assertSafeTestEnvironment(supabaseUrl)).toThrow(ProductionDatabaseViolationError);
  });

  it('should throw when database name contains production', () => {
    process.env.NODE_ENV = 'test';
    const prodDbUrl = 'postgresql://postgres:postgres@localhost:5433/prescription_saas_production';

    expect(() => assertSafeTestEnvironment(prodDbUrl)).toThrow(ProductionDatabaseViolationError);
  });

  it('should throw when hostname is an external non-whitelisted domain', () => {
    process.env.NODE_ENV = 'test';
    const unauthorizedUrl = 'postgresql://postgres:postgres@api.production-server.com:5432/db';

    expect(() => assertSafeTestEnvironment(unauthorizedUrl)).toThrow(
      ProductionDatabaseViolationError,
    );
  });

  it('should throw when DATABASE_URL is malformed', () => {
    process.env.NODE_ENV = 'test';
    const malformedUrl = 'not-a-valid-url';

    expect(() => assertSafeTestEnvironment(malformedUrl)).toThrow(ProductionDatabaseViolationError);
  });
});
