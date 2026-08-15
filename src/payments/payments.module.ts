import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { FinancialReconciliationService } from './reconciliation.service';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, FinancialReconciliationService],
  exports: [PaymentsService, FinancialReconciliationService],
})
export class PaymentsModule {}
