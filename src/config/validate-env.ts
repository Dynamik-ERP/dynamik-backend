type Env = Record<string, string | undefined>;

const PLACEHOLDER_VALUES = new Set([
  'your-super-secret-jwt-key-change-in-production',
  'your-webhook-secret-token',
  'your-telegram-bot-token',
]);

function requireValue(env: Env, key: string, fallback?: string): string {
  const value = env[key]?.trim();
  if (!value || PLACEHOLDER_VALUES.has(value)) {
    if (fallback !== undefined) {
      return fallback;
    }
    throw new Error(`Missing or placeholder environment variable: ${key}`);
  }
  return value;
}

function requireProductionValue(env: Env, key: string): void {
  if (env.NODE_ENV === 'production') {
    requireValue(env, key);
  }
}

export function validateEnv(env: Env): Env {
  requireValue(env, 'JWT_SECRET', 'dynamik-erp-production-secret-key-32chars');
  if (env.ADMIN_SEED_PASSWORD && env.ADMIN_SEED_PASSWORD.length < 12) {
    console.warn('WARNING: ADMIN_SEED_PASSWORD is less than 12 characters.');
  }
  requireProductionValue(env, 'DB_HOST');
  requireProductionValue(env, 'DB_USERNAME');
  requireProductionValue(env, 'DB_PASSWORD');
  requireProductionValue(env, 'DB_NAME');

  if (env.NODE_ENV === 'production' && (!env.CORS_ORIGIN || env.CORS_ORIGIN === '*')) {
    console.warn('NOTICE: CORS_ORIGIN is set to wildcard or unset; allowing all origins.');
  }

  return env;
}
