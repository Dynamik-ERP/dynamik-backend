import { Logger } from '@nestjs/common';

export function validateEnvironment(config: Record<string, any>): Record<string, any> {
  const logger = new Logger('EnvironmentValidation');
  const requiredVars = ['DB_HOST', 'DB_PORT', 'DB_USERNAME', 'DB_PASSWORD', 'DB_NAME', 'JWT_SECRET'];

  const missing = requiredVars.filter((varName) => !config[varName]);

  if (missing.length > 0 && config.NODE_ENV === 'production') {
    const errorMsg = `CRITICAL CONFIGURATION ERROR: Missing required environment variables in production: ${missing.join(', ')}`;
    logger.error(errorMsg);
    throw new Error(errorMsg);
  }

  if (!config.JWT_SECRET || config.JWT_SECRET === 'fallback-secret' || config.JWT_SECRET === 'change-me-in-production') {
    if (config.NODE_ENV === 'production') {
      throw new Error('CRITICAL CONFIGURATION ERROR: JWT_SECRET must be set to a secure custom value in production.');
    } else {
      logger.warn('SECURITY WARNING: Using default or weak JWT_SECRET for development.');
    }
  }

  return config;
}
