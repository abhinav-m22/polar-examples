import { createError, defineEventHandler, getHeader, readRawBody } from 'h3';
import { Webhook } from 'standardwebhooks';
import { env } from '../../../../config/env';

export default defineEventHandler(async (event) => {
  const requestBody = await readRawBody(event)
  if (!requestBody) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing request body',
    })
  }
  const webhookHeaders = {
    'webhook-id': getHeader(event, 'webhook-id'),
    'webhook-timestamp': getHeader(event, 'webhook-timestamp'),
    'webhook-signature': getHeader(event, 'webhook-signature'),
  };
  const base64Secret = Buffer.from(env.POLAR_WEBHOOK_SECRET, 'utf-8').toString('base64');
  const webhook = new Webhook(base64Secret);
  try {
    webhook.verify(requestBody, webhookHeaders as Record<string, string>);
    const payload = JSON.parse(requestBody);
    // add your logic
    return requestBody;
  } catch (error) {
    console.log(error instanceof Error ? error.message : error?.toString());
    event.node.res.statusCode = 403;
    return {
      error: error instanceof Error ? error.message : error?.toString(),
    };
  }
});
