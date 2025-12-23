import { createError, defineEventHandler, getQuery, sendRedirect } from 'h3';
import { polar } from 'src/config/polar';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const email = query['email'] as string;
  if (!email) 
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing email parameter',
    });
  const customer = await polar.customers.list({ email });
  if (!customer.result.items.length) 
    throw createError({
      statusCode: 404,
      statusMessage: 'Customer not found',
    });
  const session = await polar.customerSessions.create({
    customerId: customer.result.items[0].id,
  });
  return sendRedirect(event, session.customerPortalUrl);
});
