import { Controller, Post, Body, UseGuards, Request, Get, Query, Param } from '@nestjs/common';
import { PurchasesService } from './purchases.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { FindPurchasesDto } from './dto/find-purchases.dto';
import { PurchaseDetailDto } from './dto/purchase-detail.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
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
    summary: 'Get my purchases',
    description: 'Returns a paginated list of user purchases with advanced filters'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Purchase list retrieved successfully.',
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
    summary: 'Get my sales as purchases',
    description: 'Returns a paginated list of user sales as purchases with advanced filters'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Sales as purchases list retrieved successfully.',
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

  @Get(':id')
  @ApiOperation({ 
    summary: 'Get purchase details',
    description: 'Returns detailed information about a specific purchase, including seller, buyer and shipping status'
  })
  @ApiParam({ name: 'id', description: 'Purchase ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Purchase details retrieved successfully.',
    type: PurchaseDetailDto
  })
  @ApiResponse({ status: 404, description: 'Purchase not found.' })
  @ApiResponse({ status: 403, description: 'You do not have permission to view this purchase.' })
  findOneDetailed(
    @Param('id') id: string,
    @Request() req: AuthRequest
  ): Promise<PurchaseDetailDto> {
    return this.purchasesService.findOneDetailed(id, req.user.id);
  }
}
