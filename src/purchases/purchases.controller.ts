import { Controller, Post, Body, UseGuards, Request, Get } from '@nestjs/common';
import { PurchasesService } from './purchases.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'Create a new purchase', tags: ['purchases'] })
  @ApiResponse({ status: 201, description: 'Purchase created successfully.' })
  create(@Request() req: AuthRequest, @Body() createPurchaseDto: CreatePurchaseDto) {
    return this.purchasesService.create(req.user.id, createPurchaseDto);
  }

  @Get('my')
  @ApiOperation({ summary: 'Get my purchases', tags: ['purchases'] })
  @ApiResponse({ status: 200, description: 'Purchases retrieved successfully.' })
  findMyPurchases(@Request() req: AuthRequest) {
    return this.purchasesService.findAllByUser(req.user.id);
  }

  @Get('sold')
  @ApiOperation({ summary: 'Get my sales as purchases (sold items)', tags: ['purchases'] })
  @ApiResponse({ status: 200, description: 'Sales as purchases retrieved successfully.' })
  findMySalesAsPurchases(@Request() req: AuthRequest) {
    return this.purchasesService.findAllBySeller(req.user.id);
  }
}
