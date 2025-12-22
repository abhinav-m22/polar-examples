import { z } from 'zod'
import '@dotenvx/dotenvx/config'

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  POLAR_MODE: z.enum(['sandbox', 'production']).default('production'),
  POLAR_ACCESS_TOKEN: z.string().min(1, 'POLAR_ACCESS_TOKEN is required'),
  POLAR_WEBHOOK_SECRET: z.string().min(1, 'POLAR_WEBHOOK_SECRET is required'),
  POLAR_SUCCESS_URL: z.string().url({ message: 'POLAR_SUCCESS_URL must be a valid URL' }).optional(),
})

export type EnvConfig = z.infer<typeof envSchema>

export const env = envSchema.parse(process.env)


