import { z } from 'zod';
import 'dotenv/config';

const envSchema = z.object({
  POLAR_MODE: z.enum(['sandbox', 'production']).default('production'),
  POLAR_ACCESS_TOKEN: z.string().default(''),
  POLAR_WEBHOOK_SECRET: z.string().default(''),
  POLAR_SUCCESS_URL: z.string().optional(),
});

export const env = envSchema.parse(process.env);
