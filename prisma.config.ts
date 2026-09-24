import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  // DIRECT_URL bypasses pgbouncer — required for Prisma CLI commands (migrate, introspect, etc.)
  // The runtime PrismaClient reads DATABASE_URL (pooled) from process.env independently.
  datasource: {
    url: env('DIRECT_URL'),
  },
})
