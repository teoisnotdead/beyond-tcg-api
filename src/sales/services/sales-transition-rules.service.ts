import { Injectable } from '@nestjs/common';
import { SaleStatus } from '../entities/sale.entity';

export type UserRole = 'seller' | 'buyer' | 'system';

export type TransitionRule = {
  from: SaleStatus;
  to: SaleStatus;
  allowedRoles: UserRole[];
  requiredFields?: string[];
  validationFn?: (sale: any) => boolean;
};

@Injectable()
export class SalesTransitionRulesService {
  private readonly transitionRules: TransitionRule[] = [
    {
      from: SaleStatus.AVAILABLE,
      to: SaleStatus.RESERVED,
      allowedRoles: ['buyer'],
      requiredFields: ['quantity'],
      validationFn: (sale) => sale.quantity > 0,
    },
    {
      from: SaleStatus.RESERVED,
      to: SaleStatus.SHIPPED,
      allowedRoles: ['seller'],
      requiredFields: ['shippingProof'],
    },
    {
      from: SaleStatus.SHIPPED,
      to: SaleStatus.DELIVERED,
      allowedRoles: ['buyer'],
      requiredFields: ['deliveryProof'],
    },
    {
      from: SaleStatus.DELIVERED,
      to: SaleStatus.COMPLETED,
      allowedRoles: ['system'],
    },
    {
      from: SaleStatus.AVAILABLE,
      to: SaleStatus.CANCELLED,
      allowedRoles: ['seller'],
      requiredFields: ['reason'],
    },
    {
      from: SaleStatus.RESERVED,
      to: SaleStatus.CANCELLED,
      allowedRoles: ['seller', 'buyer'],
      requiredFields: ['reason'],
    },
    {
      from: SaleStatus.SHIPPED,
      to: SaleStatus.CANCELLED,
      allowedRoles: ['seller', 'buyer'],
      requiredFields: ['reason'],
    },
  ];

  validateTransition(
    currentStatus: SaleStatus,
    newStatus: SaleStatus,
    userRole: 'seller' | 'buyer',
    sale: any,
    providedFields: Record<string, any>,
  ): { isValid: boolean; errors: string[] } {
    const rule = this.transitionRules.find(
      (r) => r.from === currentStatus && r.to === newStatus,
    );

    if (!rule) {
      return {
        isValid: false,
        errors: [`Invalid transition from ${currentStatus} to ${newStatus}`],
      };
    }

    const errors: string[] = [];

    // Validar rol
    if (!rule.allowedRoles.includes(userRole)) {
      errors.push(`User with role ${userRole} is not allowed to perform this transition`);
    }

    // Validar campos requeridos
    if (rule.requiredFields) {
      const missingFields = rule.requiredFields.filter(
        (field) => !providedFields[field],
      );
      if (missingFields.length > 0) {
        errors.push(`Missing required fields: ${missingFields.join(', ')}`);
      }
    }

    // Validar función personalizada
    if (rule.validationFn && !rule.validationFn(sale)) {
      errors.push('Custom validation failed');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  getValidTransitions(currentStatus: SaleStatus, userRole: 'seller' | 'buyer'): SaleStatus[] {
    return this.transitionRules
      .filter((rule) => rule.from === currentStatus && rule.allowedRoles.includes(userRole))
      .map((rule) => rule.to);
  }

  getTransitionRule(from: SaleStatus, to: SaleStatus): TransitionRule | undefined {
    return this.transitionRules.find((rule) => rule.from === from && rule.to === to);
  }
} 