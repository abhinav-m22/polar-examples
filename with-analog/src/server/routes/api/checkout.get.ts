import { createError, defineEventHandler, getQuery, sendRedirect } from 'h3';
import { polar } from 'src/config/polar';
import { env } from '../../../config/env';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const products = query['products'];
  if (!products)
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing products parameter',
    });
  const checkoutSession = await polar.checkouts.create({
    products: Array.isArray(products) ? products : [products],
    ...(env.POLAR_SUCCESS_URL ? { successUrl: env.POLAR_SUCCESS_URL } : {}),
  });
  return sendRedirect(event, checkoutSession.url);
});
