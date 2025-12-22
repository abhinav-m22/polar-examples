import { Module } from '@nestjs/common'
import { PolarService } from './polar.service'

@Module({
  providers: [PolarService],
  exports: [PolarService],
})
export class PolarModule {}


