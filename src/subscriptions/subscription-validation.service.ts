import { Injectable, ForbiddenException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { SubscriptionsService } from './subscriptions.service';
import { SalesService } from '../sales/sales.service'; // Si tienes un servicio de ventas

@Injectable()
export class SubscriptionValidationService {
  constructor(
    private readonly usersService: UsersService,
    private readonly subscriptionsService: SubscriptionsService,
    // private readonly salesService: SalesService, // Descomenta si tienes este servicio
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
    // Aquí deberías contar las ventas activas del usuario
    // const activeSales = await this.salesService.countActiveSalesByUser(userId);
    const activeSales = 0; // Simulación, reemplaza por la lógica real
    return activeSales < features.maxSales;
  }

  // Valida si el usuario puede crear una tienda
  async canCreateStore(userId: string): Promise<boolean> {
    const features = await this.getUserFeatures(userId);
    return !!features.canCreateStore;
  }

  // Puedes agregar más validaciones según features...
}
