import { Controller, Get, Post, Body, Param, Delete, UseGuards, Request, ForbiddenException, UseInterceptors, UploadedFile, Patch } from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';
import { SubscriptionValidationService } from '../subscriptions/subscription-validation.service';
import { CommentsService } from '../comments/comments.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { UpdateSaleDto } from './dto/update-sale.dto';

interface AuthRequest extends ExpressRequest {
  user: { id: string; [key: string]: any };
}

@ApiTags('sales')
@ApiBearerAuth()
@Controller('sales')
@UseGuards(JwtAuthGuard)
export class SalesController {
  constructor(
    private readonly salesService: SalesService,
    private readonly subscriptionValidationService: SubscriptionValidationService,
    private readonly commentsService: CommentsService,
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({ summary: 'Create a new sale' })
  @ApiResponse({ status: 201, description: 'Sale created successfully.' })
  async create(
    @Request() req: AuthRequest,
    @Body() createSaleDto: CreateSaleDto,
    @UploadedFile() image: Express.Multer.File
  ) {
    const canCreate = await this.subscriptionValidationService.canCreateSale(req.user.id);
    if (!canCreate) {
      throw new ForbiddenException('You have reached the limit of active sales according to your subscription plan.');
    }
    return this.salesService.create(req.user.id, createSaleDto, image);
  }

  @Get()
  @ApiOperation({ summary: 'Get all sales' })
  @ApiResponse({ status: 200, description: 'Sales retrieved successfully.' })
  findAll(@Request() req) {
    const { page = 1, limit = 20, ...filters } = req.query;
    return this.salesService.findAll(Number(page), Number(limit), filters);
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
    // Only the buyer can reserve
    return this.salesService.reserveSale(id, req.user.id);
  }

  @Post(':id/ship')
  @ApiOperation({ summary: 'Mark sale as shipped' })
  async shipSale(
    @Param('id') id: string,
    @Request() req: AuthRequest,
    @Body('shipping_proof_url') shippingProofUrl: string
  ) {
    // Only the seller can mark as shipped
    return this.salesService.shipSale(id, req.user.id, shippingProofUrl);
  }

  @Post(':id/confirm-delivery')
  @ApiOperation({ summary: 'Confirm delivery of sale' })
  async confirmDelivery(
    @Param('id') id: string,
    @Request() req: AuthRequest,
    @Body('delivery_proof_url') deliveryProofUrl: string
  ) {
    // Only the buyer can confirm delivery
    return this.salesService.confirmDelivery(id, req.user.id, deliveryProofUrl);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel sale' })
  async cancelSale(@Param('id') id: string, @Request() req: AuthRequest) {
    // Seller or buyer can cancel if status is reserved
    return this.salesService.cancelSale(id, req.user.id);
  }

  @Get(':id/comments')
  @ApiOperation({ summary: 'Get all comments for this sale' })
  getCommentsForSale(@Param('id') id: string) {
    return this.commentsService.findAllForSale(id);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search sales by term, category, pagination and offset' })
  @ApiResponse({ status: 200, description: 'Sales found.' })
  async searchSales(@Request() req) {
    const { search, page = 1, limit = 20, offset, categories } = req.query;
    return this.salesService.searchSales({ search, page: Number(page), limit: Number(limit), offset: offset !== undefined ? Number(offset) : undefined, categories });
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({ summary: 'Update a sale' })
  @ApiResponse({ status: 200, description: 'Sale updated successfully.' })
  async update(
    @Param('id') id: string,
    @Request() req: AuthRequest,
    @Body() updateSaleDto: UpdateSaleDto,
    @UploadedFile() image?: Express.Multer.File
  ) {
    // Aquí podrías validar que el usuario sea el vendedor
    return this.salesService.update(id, req.user.id, updateSaleDto, image);
  }
}
