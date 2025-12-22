import { Injectable } from '@nestjs/common'
import { Polar } from '@polar-sh/sdk'
import { env } from '../config/env.config'

@Injectable()
export class PolarService {
  private readonly polar: Polar

  constructor() {
    this.polar = new Polar({
      accessToken: env.POLAR_ACCESS_TOKEN,
      server: env.POLAR_MODE,
    })
  }

  async listProducts(isArchived = false) {
    return this.polar.products.list({ isArchived })
  }

  async createCheckout(productIds: string[]) {
    return this.polar.checkouts.create({
      products: productIds,
      ...(env.POLAR_SUCCESS_URL ? { successUrl: env.POLAR_SUCCESS_URL } : {}),
    })
  }

  async listCustomers(email: string) {
    return this.polar.customers.list({ email })
  }

  async createCustomerSession(customerId: string) {
    return this.polar.customerSessions.create({ customerId })
  }
}


