import { defineConfig } from '@prisma/client'

export default defineConfig({
  datasourceUrl: process.env.POSTGRES_PRISMA_URL,
})