import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Consent } from './entities/consent.entity';
import { UserAccount } from '../auth/entities/user-account.entity';
import { ConsentService } from './consent.service';
import { ConsentController } from './consent.controller';
import { ConsentGuard } from './guards/consent.guard';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [TypeOrmModule.forFeature([Consent, UserAccount]), AuditModule],
  controllers: [ConsentController],
  providers: [ConsentService, ConsentGuard],
  exports: [ConsentService, ConsentGuard],
})
export class ConsentModule {}
