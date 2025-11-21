// drizzle.config.ts
// Drizzle configuration for database migrations

const { defineConfig } = require('drizzle-kit');

module.exports = defineConfig({
  schema: './shared/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
