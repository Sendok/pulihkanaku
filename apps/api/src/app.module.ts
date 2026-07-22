import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { HealthController } from "./health.controller.js";
import { InfrastructureModule } from "./infrastructure.module.js";
import { AuthController, AuthService } from "./modules/auth.js";
import { DocumentController, DocumentService } from "./modules/documents.js";
import { PayoutController, PayoutService, ReconciliationController, WebhookController } from "./modules/payouts.js";
import { AssignmentsController, CoreDomainService, DisputesController, JobsController, PaymentsController, WorkersController } from "./modules/core-domain.js";
import { MessagingController, MessagingService, NotificationsController, RiskController, SupportController } from "./modules/operations.js";
import { AdminContentController, ContentController, ContentService, PlansController } from "./modules/content.js";
import { AlertService, configureObservability, MetricsService, ObservabilityController, ObservabilityMiddleware } from "./observability.js";

@Module({
  imports: [InfrastructureModule],
  controllers: [HealthController, ObservabilityController, AuthController, WorkersController, JobsController, AssignmentsController, PaymentsController, DisputesController, MessagingController, NotificationsController, RiskController, SupportController, ContentController, AdminContentController, PlansController, DocumentController, PayoutController, WebhookController, ReconciliationController],
  providers: [MetricsService, AlertService, ObservabilityMiddleware, AuthService, CoreDomainService, MessagingService, ContentService, DocumentService, PayoutService],
})
export class AppModule implements NestModule {configure(consumer:MiddlewareConsumer){configureObservability(consumer)}}
