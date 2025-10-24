import { PrismaClient } from "@prisma/client"

// Resolve a database URL in a resilient way. Some environments expose the
// connection string under different names. We also pass it directly to
// PrismaClient to avoid relying on a specific env var name baked into a
// previously generated client.
const resolvedDatabaseUrl =
  process.env.DATABASE_URL ||
  process.env.DB_URL ||
  process.env.POSTGRES_URL ||
  process.env.NEON_DATABASE_URL

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    datasources: resolvedDatabaseUrl
      ? { db: { url: resolvedDatabaseUrl } }
      : undefined,
  })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
