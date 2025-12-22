import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { env } from './config/env.config'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  })
  await app.listen(env.PORT)
  console.log(`🚀 Application is running on: http://localhost:${env.PORT}`)
}

bootstrap()


