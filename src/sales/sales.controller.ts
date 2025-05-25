import { Controller, Get, Post, Body, Param, Delete, UseGuards, Request, ForbiddenException, UseInterceptors, UploadedFile, Patch, Query } from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';
import { SubscriptionValidationService } from '../subscriptions/subscription-validation.service';
import { CommentsService } from '../comments/comments.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { SalesStateService } from './sales-state.service';
import { ReserveSaleDto, ShipSaleDto, ConfirmDeliveryDto, CancelSaleDto } from './dto/change-sale-state.dto';
import { Sale } from './entities/sale.entity';
import { SalesHistoryService } from './sales-history.service';
import { SalesHistoryFilterDto } from './dto/sales-history-filter.dto';
import { HistoryItem } from './interfaces/history-item.interface';
import { HistoryItemSchema } from './interfaces/history-item.schema';

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
    private readonly salesStateService: SalesStateService,
    private readonly salesHistoryService: SalesHistoryService,
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
  @ApiResponse({ status: 200, description: 'Sale reserved successfully', type: Sale })
  async reserveSale(
    @Param('id') id: string,
    @Body() dto: ReserveSaleDto,
    @Request() req,
  ): Promise<Sale> {
    dto.saleId = id;
    return this.salesStateService.reserveSale(dto, req.user.id);
  }

  @Post(':id/ship')
  @ApiOperation({ summary: 'Mark sale as shipped' })
  @ApiResponse({ status: 200, description: 'Sale marked as shipped successfully', type: Sale })
  async shipSale(
    @Param('id') id: string,
    @Body() dto: ShipSaleDto,
    @Request() req,
  ): Promise<Sale> {
    dto.saleId = id;
    return this.salesStateService.shipSale(dto, req.user.id);
  }

  @Post(':id/confirm-delivery')
  @ApiOperation({ summary: 'Confirm sale delivery' })
  @ApiResponse({ status: 200, description: 'Delivery confirmed successfully', type: Sale })
  async confirmDelivery(
    @Param('id') id: string,
    @Body() dto: ConfirmDeliveryDto,
    @Request() req,
  ): Promise<Sale> {
    dto.saleId = id;
    return this.salesStateService.confirmDelivery(dto, req.user.id);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Complete a sale' })
  @ApiResponse({ status: 200, description: 'Sale completed successfully', type: Sale })
  async completeSale(
    @Param('id') id: string,
    @Request() req,
  ): Promise<Sale> {
    return this.salesStateService.completeSale(id, req.user.id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel a sale' })
  @ApiResponse({ status: 200, description: 'Sale cancelled successfully', type: Sale })
  async cancelSale(
    @Param('id') id: string,
    @Body() dto: CancelSaleDto,
    @Request() req,
  ): Promise<Sale> {
    dto.saleId = id;
    return this.salesStateService.cancelSale(dto, req.user.id);
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

  @Post(':id/relist')
  @ApiOperation({ summary: 'Relist a cancelled sale' })
  @ApiResponse({ status: 201, description: 'Sale relisted successfully.' })
  async relistSale(
    @Param('id') id: string,
    @Request() req: AuthRequest,
    @Body() updateData?: Partial<CreateSaleDto>
  ) {
    return this.salesService.relistSale(id, req.user.id, updateData);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get unified sales history' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns a paginated list of sales, cancelled sales, and purchases',
    type: HistoryItemSchema,
    isArray: true
  })
  async getSalesHistory(
    @Request() req,
    @Query() filters: SalesHistoryFilterDto
  ): Promise<{
    items: HistoryItem[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    return this.salesHistoryService.getSalesHistory(req.user.id, filters);
  }
}
