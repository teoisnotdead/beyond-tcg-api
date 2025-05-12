import { Controller, Get, Post, Body, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';

interface AuthRequest extends ExpressRequest {
  user: { id: string; [key: string]: any };
}

@ApiTags('sales')
@ApiBearerAuth()
@Controller('sales')
@UseGuards(JwtAuthGuard)
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new sale' })
  @ApiResponse({ status: 201, description: 'Sale created successfully.' })
  create(@Request() req: AuthRequest, @Body() createSaleDto: CreateSaleDto) {
    return this.salesService.create(req.user.id, createSaleDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all sales' })
  @ApiResponse({ status: 200, description: 'Sales retrieved successfully.' })
  findAll() {
    return this.salesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get sale by ID' })
  @ApiResponse({ status: 200, description: 'Sale retrieved successfully.' })
  findOne(@Param('id') id: string) {
    return this.salesService.findOne(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete sale' })
  @ApiResponse({ status: 200, description: 'Sale deleted successfully.' })
  remove(@Param('id') id: string) {
    return this.salesService.remove(id);
  }

  @Post(':id/reserve')
  @ApiOperation({ summary: 'Reserve a sale' })
  async reserveSale(@Param('id') id: string, @Request() req: AuthRequest) {
    // Solo el comprador puede reservar
    return this.salesService.reserveSale(id, req.user.id);
  }

  @Post(':id/ship')
  @ApiOperation({ summary: 'Mark sale as shipped' })
  async shipSale(
    @Param('id') id: string,
    @Request() req: AuthRequest,
    @Body('shipping_proof_url') shippingProofUrl: string
  ) {
    // Solo el vendedor puede marcar como enviada
    return this.salesService.shipSale(id, req.user.id, shippingProofUrl);
  }

  @Post(':id/confirm-delivery')
  @ApiOperation({ summary: 'Confirm delivery of sale' })
  async confirmDelivery(
    @Param('id') id: string,
    @Request() req: AuthRequest,
    @Body('delivery_proof_url') deliveryProofUrl: string
  ) {
    // Solo el comprador puede confirmar entrega
    return this.salesService.confirmDelivery(id, req.user.id, deliveryProofUrl);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel sale' })
  async cancelSale(@Param('id') id: string, @Request() req: AuthRequest) {
    // Vendedor o comprador pueden cancelar si está en reserved
    return this.salesService.cancelSale(id, req.user.id);
  }
}
