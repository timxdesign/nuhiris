import { Module } from '@nestjs/common';
import { TerminologyService } from './terminology.service';
import { TerminologyController } from './terminology.controller';

@Module({
  controllers: [TerminologyController],
  providers: [TerminologyService],
  exports: [TerminologyService],
})
export class TerminologyModule {}
