import { Module } from "@nestjs/common";
import { HealthController } from "./health.controller.js";
import { InfrastructureModule } from "./infrastructure.module.js";
import { AuthController, AuthService } from "./modules/auth.js";
import { DocumentController, DocumentService } from "./modules/documents.js";
import { PayoutController, PayoutService, ReconciliationController, WebhookController } from "./modules/payouts.js";
import { AssignmentsController, CoreDomainService, DisputesController, JobsController, PaymentsController, WorkersController } from "./modules/core-domain.js";
import { MessagingController, MessagingService, NotificationsController, RiskController, SupportController } from "./modules/operations.js";
import { AdminContentController, ContentController, ContentService, PlansController } from "./modules/content.js";

@Module({
  imports: [InfrastructureModule],
  controllers: [HealthController, AuthController, WorkersController, JobsController, AssignmentsController, PaymentsController, DisputesController, MessagingController, NotificationsController, RiskController, SupportController, ContentController, AdminContentController, PlansController, DocumentController, PayoutController, WebhookController, ReconciliationController],
  providers: [AuthService, CoreDomainService, MessagingService, ContentService, DocumentService, PayoutService],
})
export class AppModule {}
