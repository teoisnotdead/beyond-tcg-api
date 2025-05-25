import { Controller, Post, Body, UseGuards, Request, Get, Query } from '@nestjs/common';
import { PurchasesService } from './purchases.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { FindPurchasesDto } from './dto/find-purchases.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';

interface AuthRequest extends ExpressRequest {
  user: { id: string; [key: string]: any };
}

@ApiTags('purchases')
@ApiBearerAuth()
@Controller('purchases')
@UseGuards(JwtAuthGuard)
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una nueva compra' })
  @ApiResponse({ status: 201, description: 'Compra creada exitosamente.' })
  create(@Request() req: AuthRequest, @Body() createPurchaseDto: CreatePurchaseDto) {
    return this.purchasesService.create(req.user.id, createPurchaseDto);
  }

  @Get('my')
  @ApiOperation({ 
    summary: 'Obtener mis compras',
    description: 'Retorna una lista paginada de las compras del usuario con filtros avanzados'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de compras obtenida exitosamente.',
    schema: {
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/Purchase' }
        },
        meta: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            page: { type: 'number' },
            limit: { type: 'number' },
            totalPages: { type: 'number' }
          }
        }
      }
    }
  })
  findMyPurchases(
    @Request() req: AuthRequest,
    @Query() filters: FindPurchasesDto
  ) {
    return this.purchasesService.findAllByUser(req.user.id, filters);
  }

  @Get('sold')
  @ApiOperation({ 
    summary: 'Obtener mis ventas como compras',
    description: 'Retorna una lista paginada de las ventas del usuario como compras con filtros avanzados'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de ventas como compras obtenida exitosamente.',
    schema: {
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/Purchase' }
        },
        meta: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            page: { type: 'number' },
            limit: { type: 'number' },
            totalPages: { type: 'number' }
          }
        }
      }
    }
  })
  findMySalesAsPurchases(
    @Request() req: AuthRequest,
    @Query() filters: FindPurchasesDto
  ) {
    return this.purchasesService.findAllBySeller(req.user.id, filters);
  }
}
