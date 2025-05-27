import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { SalesTransitionRulesService } from '../services/sales-transition-rules.service';
import { SalesService } from '../sales.service';
import { SaleStatus } from '../entities/sale.entity';

@Injectable()
export class SalesTransitionMiddleware implements NestMiddleware {
  constructor(
    private readonly salesTransitionRulesService: SalesTransitionRulesService,
    private readonly salesService: SalesService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const { saleId } = req.params;
    const body = req.body || {};
    const status = body.status;
    const userId = (req as any).user?.id;

    if (!saleId || !status || !userId) {
      return next();
    }

    try {
      const sale = await this.salesService.findOne(saleId);
      if (!sale) {
        throw new BadRequestException('Sale not found');
      }

      // Determinar el rol del usuario
      let userRole: 'seller' | 'buyer' = 'seller';
      if (sale.seller?.id === userId) {
        userRole = 'seller';
      } else if (sale.buyer?.id === userId) {
        userRole = 'buyer';
      }

      // Validar la transición
      const validation = this.salesTransitionRulesService.validateTransition(
        sale.status,
        status as SaleStatus,
        userRole,
        sale,
        body,
      );

      if (!validation.isValid) {
        throw new BadRequestException({
          message: 'Invalid state transition',
          errors: validation.errors,
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  }
} 