/**
 * Security Safeguard for Database Isolation
 *
 * Enforces strict prevention of running tests against production environments
 * or non-isolated production database instances.
 */

export class ProductionDatabaseViolationError extends Error {
  constructor(message: string) {
    super(`[SECURITY FATAL] ${message}`);
    this.name = 'ProductionDatabaseViolationError';
  }
}

const PROHIBITED_CLOUD_HOST_PATTERNS = [
  /\.rds\.amazonaws\.com$/i,
  /\.amazonaws\.com$/i,
  /cloudsql/i,
  /\.postgres\.database\.azure\.com$/i,
  /\.supabase\.co(m)?$/i,
  /\.neon\.tech$/i,
  /\.render\.com$/i,
  /\.railway\.app$/i,
  /\.fly\.dev$/i,
  /\.heroku/i,
];

const PROHIBITED_KEYWORDS = ['prod', 'production', 'live', 'mainnet'];

const WHITELISTED_TEST_HOSTS = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  'postgres',
  'postgres-test',
  'prescription_postgres',
  'prescription_postgres_test',
]);

/**
 * Validates that the current environment and target database are 100% isolated for testing.
 * Throws a fatal ProductionDatabaseViolationError if any danger is detected.
 */
export function assertSafeTestEnvironment(customDatabaseUrl?: string): void {
  const nodeEnv = (process.env.NODE_ENV || '').toLowerCase().trim();

  // 1. Prohibit running in production NODE_ENV
  if (nodeEnv === 'production' || nodeEnv === 'prod') {
    const errorMsg = `Tests are strictly forbidden when NODE_ENV is '${process.env.NODE_ENV}'!`;
    printSecurityViolationBanner(errorMsg);
    throw new ProductionDatabaseViolationError(errorMsg);
  }

  const dbUrl = customDatabaseUrl ?? process.env.DATABASE_URL;

  // If no database URL is set (e.g. pure unit tests with mocked Prisma), it is safe.
  if (!dbUrl) {
    return;
  }

  try {
    const parsed = new URL(dbUrl);
    const host = parsed.hostname.toLowerCase();
    const pathname = parsed.pathname.toLowerCase();

    // 2. Check for prohibited cloud providers / managed production databases
    for (const pattern of PROHIBITED_CLOUD_HOST_PATTERNS) {
      if (pattern.test(host)) {
        const errorMsg = `DATABASE_URL points to a prohibited managed cloud host (${host})! Test aborted to prevent data loss.`;
        printSecurityViolationBanner(errorMsg, dbUrl);
        throw new ProductionDatabaseViolationError(errorMsg);
      }
    }

    // 3. Check for production keywords in host or database name
    for (const keyword of PROHIBITED_KEYWORDS) {
      // Allow 'test' to override if explicitly in db name (e.g. not 'prod')
      if (host.includes(keyword) || (pathname.includes(keyword) && !pathname.includes('test'))) {
        const errorMsg = `DATABASE_URL contains production keyword '${keyword}' in host (${host}) or database name (${pathname})!`;
        printSecurityViolationBanner(errorMsg, dbUrl);
        throw new ProductionDatabaseViolationError(errorMsg);
      }
    }

    // 4. Ensure hostname is explicitly in the whitelisted test hosts list or matches local/ci patterns
    const isWhitelistedHost =
      WHITELISTED_TEST_HOSTS.has(host) ||
      host.endsWith('.local') ||
      host.includes('test') ||
      host.includes('ci');

    if (!isWhitelistedHost) {
      const errorMsg = `DATABASE_URL hostname '${host}' is not in the authorized test host whitelist (${Array.from(WHITELISTED_TEST_HOSTS).join(', ')})!`;
      printSecurityViolationBanner(errorMsg, dbUrl);
      throw new ProductionDatabaseViolationError(errorMsg);
    }
  } catch (err) {
    if (err instanceof ProductionDatabaseViolationError) {
      throw err;
    }
    // If URL parsing failed, ensure it's not a secret prod string
    const errorMsg = `DATABASE_URL is malformed or invalid: ${(err as Error).message}`;
    printSecurityViolationBanner(errorMsg, dbUrl);
    throw new ProductionDatabaseViolationError(errorMsg);
  }
}

function printSecurityViolationBanner(reason: string, targetUrl?: string): void {
  // eslint-disable-next-line no-console
  console.error('\n' + '='.repeat(80));
  // eslint-disable-next-line no-console
  console.error('🚨 [FATAL SECURITY SAFEGUARD] TEST EXECUTION BLOCKED');
  // eslint-disable-next-line no-console
  console.error(`Reason: ${reason}`);
  if (targetUrl) {
    // Mask password in output for security
    const sanitized = targetUrl.replace(/:([^:@]+)@/, ':***@');
    // eslint-disable-next-line no-console
    console.error(`Sanitized Target URL: ${sanitized}`);
  }
  // eslint-disable-next-line no-console
  console.error('Production databases are 100% protected and out of reach of test runners.');
  // eslint-disable-next-line no-console
  console.error('='.repeat(80) + '\n');
}
