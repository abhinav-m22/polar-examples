import { Controller, Get, HttpException, HttpStatus, Post, Query, RawBodyRequest, Req, Res } from '@nestjs/common'
import { Request, Response } from 'express'
import { Webhook } from 'standardwebhooks'
import { env } from './config/env.config'
import { PolarService } from './polar/polar.service'

@Controller()
export class AppController {
  constructor(private readonly polarService: PolarService) {}

  @Get()
  async getHome(@Res() res: Response) {
    const products = await this.polarService.listProducts(false)
    const html = `
<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Dashboard</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body class="bg-white flex flex-col items-center justify-center gap-16 min-h-screen">
    <div class="w-[360px] max-w-[90%] flex flex-col gap-3">
      ${products.result.items
        .map(
          (p) => `
          <a 
            href="/checkout?products=${p.id}" 
            target="_blank"
            class="block text-center px-4 py-3 border rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-900 transition"
          >
            Buy ${p.name}
          </a>
        `,
        )
        .join('')}
    </div>
    <form action="/portal" method="get" class="flex gap-2">
      <input 
        required
        type="email" 
        name="email" 
        placeholder="Email"
        class="px-4 py-2 text-base border rounded-lg w-[260px] focus:outline-none focus:border-black"
      />
      <button 
        type="submit" 
        class="px-6 py-2 text-base bg-black text-white rounded-lg hover:opacity-80 transition"
      >
        Continue
      </button>
    </form>
  </body>
</html>
    `

    res.send(html)
  }

  @Post('polar/webhooks')
  async handleWebhook(@Req() req: RawBodyRequest<Request>, @Res() res: Response) {
    try {
      const requestBody = req.rawBody?.toString('utf-8') || ''
      const webhookHeaders = {
        'webhook-id': req.headers['webhook-id'] as string,
        'webhook-timestamp': req.headers['webhook-timestamp'] as string,
        'webhook-signature': req.headers['webhook-signature'] as string,
      }
      const base64Secret = Buffer.from(env.POLAR_WEBHOOK_SECRET, 'utf-8').toString('base64')
      const webhook = new Webhook(base64Secret)
      webhook.verify(requestBody, webhookHeaders)
      const payload = JSON.parse(requestBody)
      res.status(HttpStatus.OK).send(requestBody)
    } catch (error) {
      console.error(error.message || error.toString())
      throw new HttpException(error.message || error.toString(), HttpStatus.FORBIDDEN)
    }
  }

  @Get('checkout')
  async createCheckout(@Query('products') products: string | string[], @Res() res: Response) {
    const productIds = Array.isArray(products) ? products : [products]
    const checkoutSession = await this.polarService.createCheckout(productIds)
    res.redirect(checkoutSession.url)
  }

  @Get('portal')
  async getPortal(@Query('email') email: string, @Res() res: Response) {
    if (!email) throw new HttpException('Missing email parameter', HttpStatus.BAD_REQUEST)
    const customer = await this.polarService.listCustomers(email)
    if (!customer.result.items.length) throw new HttpException('Customer not found', HttpStatus.NOT_FOUND)
    const session = await this.polarService.createCustomerSession(customer.result.items[0].id)
    res.redirect(session.customerPortalUrl)
  }
}


