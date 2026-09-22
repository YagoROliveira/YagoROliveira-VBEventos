function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const defaultApiKey = process.env.NODE_ENV === "production" ? "" : "dev-events-api-key";

export const config = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  isProduction: process.env.NODE_ENV === "production",
  host: process.env.API_HOST ?? "0.0.0.0",
  port: Number(process.env.API_PORT ?? 3000),
  databaseUrl: required("DATABASE_URL", "postgresql://events:events@localhost:5432/events?schema=public"),
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
  logLevel: process.env.LOG_LEVEL ?? "info",
  apiKey: required("API_KEY", defaultApiKey || undefined),
  sqids: {
    alphabet: process.env.SQIDS_ALPHABET ?? "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
    minLength: Number(process.env.SQIDS_MIN_LENGTH ?? 8),
  },
};
