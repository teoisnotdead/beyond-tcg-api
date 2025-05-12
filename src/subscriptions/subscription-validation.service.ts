import { Injectable } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { SalesService } from '../sales/sales.service';

@Injectable()
export class SubscriptionValidationService {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly salesService: SalesService,
  ) {}

  // Obtiene los features del plan activo del usuario
  async getUserFeatures(userId: string): Promise<any> {
    const subscription = await this.subscriptionsService.getCurrentSubscription(userId);
    const plan = await this.subscriptionsService.getPlanById(subscription.plan_id);
    return plan.features;
  }

  // Valida si el usuario puede crear una venta
  async canCreateSale(userId: string): Promise<boolean> {
    const features = await this.getUserFeatures(userId);
    // Cuenta las ventas activas del usuario usando el servicio real
    const activeSales = await this.salesService.countActiveSalesByUser(userId);
    return activeSales < features.maxSales;
  }

  // Valida si el usuario puede crear una tienda
  async canCreateStore(userId: string): Promise<boolean> {
    const features = await this.getUserFeatures(userId);
    return !!features.canCreateStore;
  }

  // Puedes agregar más validaciones según features...
}
