import { defineEventHandler } from 'h3';
import { polar } from 'src/config/polar';

export default defineEventHandler(async (event) => {
  const products = await polar.products.list({ isArchived: false });
  return products.result.items;
});
