import { defineEventHandler } from 'h3';
import { Polar } from '@polar-sh/sdk';
import { env } from '../../../config/env';

export default defineEventHandler(async (event) => {
  const polar = new Polar({ 
    accessToken: env.POLAR_ACCESS_TOKEN, 
    server: env.POLAR_MODE 
  });
  const products = await polar.products.list({ isArchived: false });
  return products.result.items;
});
