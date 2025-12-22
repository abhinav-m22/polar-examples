import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { PolarModule } from './polar/polar.module'

@Module({
  imports: [PolarModule],
  controllers: [AppController],
})
export class AppModule {}


