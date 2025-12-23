import { createError, defineEventHandler, getQuery, sendRedirect } from 'h3';
import { Polar } from '@polar-sh/sdk';
import { env } from '../../../config/env';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const products = query['products'];
  if (!products)
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing products parameter',
    });
  const polar = new Polar({ 
    accessToken: env.POLAR_ACCESS_TOKEN, 
    server: env.POLAR_MODE 
  });
  const checkoutSession = await polar.checkouts.create({
    products: Array.isArray(products) ? products : [products],
    ...(env.POLAR_SUCCESS_URL ? { successUrl: env.POLAR_SUCCESS_URL } : {}),
  });
  return sendRedirect(event, checkoutSession.url);
});
