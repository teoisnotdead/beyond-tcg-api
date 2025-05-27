import { Controller, Get, Post, Body, Param, Delete, UseGuards, Request, ForbiddenException, UseInterceptors, UploadedFile, Patch, Query, NotFoundException, BadRequestException, UploadedFiles } from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';
import { SubscriptionValidationService } from '../subscriptions/subscription-validation.service';
import { CommentsService } from '../comments/comments.service';
import { FileInterceptor, AnyFilesInterceptor } from '@nestjs/platform-express';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { SalesStateService } from './services/sales-state.service';
import { ReserveSaleDto, ShipSaleDto, ConfirmDeliveryDto, CancelSaleDto } from './dto/change-sale-state.dto';
import { Sale, SaleStatus } from './entities/sale.entity';
import { SalesHistoryService } from './services/sales-history.service';
import { SalesHistoryFilterDto, HistoryItemType, SortField, SortOrder } from './dto/sales-history-filter.dto';
import { HistoryItem } from './interfaces/history-item.interface';
import { SalesTransitionRulesService } from './services/sales-transition-rules.service';
import { SalesMetricsService } from './services/sales-metrics.service';
import { SalesMetricsDto } from './dto/sales-metrics.dto';
import { SalesReportService } from './services/sales-report.service';
import { SalesReportDto, SalesReportFilterDto } from './dto/sales-report.dto';

interface AuthRequest extends ExpressRequest {
  user: { id: string; [key: string]: any };
}

@ApiTags('sales')
@ApiBearerAuth()
@Controller('sales')
export class SalesController {
  constructor(
    private readonly salesService: SalesService,
    private readonly subscriptionValidationService: SubscriptionValidationService,
    private readonly commentsService: CommentsService,
    private readonly salesStateService: SalesStateService,
    private readonly salesHistoryService: SalesHistoryService,
    private readonly salesTransitionRulesService: SalesTransitionRulesService,
    private readonly salesMetricsService: SalesMetricsService,
    private readonly salesReportService: SalesReportService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({ summary: 'Create a new sale' })
  @ApiResponse({ status: 201, description: 'Sale created successfully.' })
  async create(
    @Request() req: AuthRequest,
    @Body() createSaleDto: CreateSaleDto,
    @UploadedFile() image: Express.Multer.File
  ) {
    if (!image) {
      throw new BadRequestException('The image is required');
    }
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
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete sale' })
  @ApiResponse({ status: 200, description: 'Sale deleted successfully.' })
  remove(@Param('id') id: string) {
    return this.salesService.remove(id);
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
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({ summary: 'Update a sale' })
  @ApiResponse({ status: 200, description: 'Sale updated successfully.' })
  async update(
    @Param('id') id: string,
    @Request() req: AuthRequest,
    @Body() updateSaleDto: UpdateSaleDto,
    @UploadedFile() image?: Express.Multer.File
  ) {
    return this.salesService.update(id, req.user.id, updateSaleDto, image);
  }

  @Post(':id/relist')
  @UseGuards(JwtAuthGuard)
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
  @ApiOperation({ 
    summary: 'Get unified sales history',
    description: 'Returns a paginated list of sales, cancelled sales, and purchases with advanced filtering and statistics'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns a paginated list of sales history with statistics',
    schema: {
      properties: {
        items: {
          type: 'array',
          items: { $ref: '#/components/schemas/HistoryItem' }
        },
        total: { type: 'number' },
        page: { type: 'number' },
        totalPages: { type: 'number' },
        stats: {
          type: 'object',
          properties: {
            total_sales: { type: 'number' },
            total_revenue: { type: 'number' },
            sales_by_status: {
              type: 'object',
              properties: {
                available: { type: 'number' },
                reserved: { type: 'number' },
                shipped: { type: 'number' },
                delivered: { type: 'number' },
                completed: { type: 'number' },
                cancelled: { type: 'number' }
              }
            },
            sales_by_period: {
              type: 'object',
              properties: {
                today: { type: 'number' },
                this_week: { type: 'number' },
                this_month: { type: 'number' }
              }
            }
          }
        }
      }
    }
  })
  @ApiQuery({ name: 'type', enum: HistoryItemType, required: false, description: 'Filter by item type' })
  @ApiQuery({ name: 'types', enum: HistoryItemType, isArray: true, required: false, description: 'Filter by multiple item types' })
  @ApiQuery({ name: 'status', enum: SaleStatus, required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'statuses', enum: SaleStatus, isArray: true, required: false, description: 'Filter by multiple statuses' })
  @ApiQuery({ name: 'search', required: false, description: 'Search in name and description' })
  @ApiQuery({ name: 'category_id', required: false, description: 'Filter by category ID' })
  @ApiQuery({ name: 'category_ids', isArray: true, required: false, description: 'Filter by multiple category IDs' })
  @ApiQuery({ name: 'language_id', required: false, description: 'Filter by language ID' })
  @ApiQuery({ name: 'language_ids', isArray: true, required: false, description: 'Filter by multiple language IDs' })
  @ApiQuery({ name: 'store_id', required: false, description: 'Filter by store ID' })
  @ApiQuery({ name: 'store_ids', isArray: true, required: false, description: 'Filter by multiple store IDs' })
  @ApiQuery({ name: 'start_date', required: false, description: 'Filter by start date (ISO format)' })
  @ApiQuery({ name: 'end_date', required: false, description: 'Filter by end date (ISO format)' })
  @ApiQuery({ name: 'min_price', required: false, description: 'Filter by minimum price' })
  @ApiQuery({ name: 'max_price', required: false, description: 'Filter by maximum price' })
  @ApiQuery({ name: 'min_quantity', required: false, description: 'Filter by minimum quantity' })
  @ApiQuery({ name: 'max_quantity', required: false, description: 'Filter by maximum quantity' })
  @ApiQuery({ name: 'has_shipping_proof', required: false, description: 'Filter by presence of shipping proof' })
  @ApiQuery({ name: 'has_delivery_proof', required: false, description: 'Filter by presence of delivery proof' })
  @ApiQuery({ name: 'sort_by', enum: SortField, required: false, description: 'Field to sort by' })
  @ApiQuery({ name: 'sort_order', enum: SortOrder, required: false, description: 'Sort order' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 20)' })
  async getSalesHistory(
    @Request() req,
    @Query() filters: SalesHistoryFilterDto
  ): Promise<{
    items: HistoryItem[];
    total: number;
    page: number;
    totalPages: number;
    stats?: {
      total_sales: number;
      total_revenue: number;
      sales_by_status: Record<SaleStatus, number>;
      sales_by_period: {
        today: number;
        this_week: number;
        this_month: number;
      };
    };
  }> {
    return this.salesHistoryService.getSalesHistory(req.user.id, filters);
  }

  @Patch(':saleId/status')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(AnyFilesInterceptor())
  @ApiOperation({ 
    summary: 'Update sale status',
    description: 'Update the status of a sale. Supports all state transitions: reserve, ship, confirm delivery, complete, and cancel.'
  })
  @ApiResponse({
    status: 200,
    description: 'Sale status updated successfully',
    type: Sale,
  })
  @ApiResponse({ status: 400, description: 'Invalid state transition or missing required data' })
  @ApiResponse({ status: 403, description: 'Forbidden - User not authorized for this action' })
  @ApiResponse({ status: 404, description: 'Sale not found' })
  async updateSaleStatus(
    @Param('saleId') saleId: string,
    @Body('status') status: SaleStatus,
    @Body() updateData: any,
    @Request() req: AuthRequest,
    @UploadedFiles() files?: Express.Multer.File[]
  ): Promise<Sale> {

    const sale = await this.salesService.findOne(saleId);
    if (!sale) {
      throw new NotFoundException('Sale not found');
    }

    // Determine user role securely
    let userRole: 'seller' | 'buyer' = 'seller';
    if (sale.seller?.id === req.user.id) {
      userRole = 'seller';
    } else if (sale.buyer_id === req.user.id) {
      userRole = 'buyer';
    } else if (sale.status === SaleStatus.AVAILABLE && sale.seller?.id !== req.user.id) {
      // If the sale is available and the user is not the seller, they are a potential buyer
      userRole = 'buyer';
    }

    const validTransitions = this.salesTransitionRulesService.getValidTransitions(
      sale.status,
      userRole,
    );

    if (!validTransitions.includes(status)) {
      const rule = this.salesTransitionRulesService.getTransitionRule(sale.status, status);
      const errorMessage = rule 
        ? `User with role ${userRole} is not allowed to perform this transition. Only ${rule.allowedRoles.join(' or ')} can transition from ${sale.status} to ${status}`
        : `Cannot transition from ${sale.status} to ${status}`;

      throw new BadRequestException({
        message: 'Invalid state transition',
        errors: [errorMessage],
        validTransitions,
        currentRole: userRole,
        requiredRoles: rule?.allowedRoles || []
      });
    }

    // Validate that the sale has a buyer for certain states
    if ([SaleStatus.SHIPPED, SaleStatus.DELIVERED, SaleStatus.COMPLETED, SaleStatus.CANCELLED].includes(status)) {
      if (!sale.buyer_id) {
        throw new BadRequestException('Sale has no buyer assigned');
      }
    }

    // Find files by field
    const shippingProof = files?.find(f => f.fieldname === 'shippingProof');
    const deliveryProof = files?.find(f => f.fieldname === 'deliveryProof');

    // State-specific validations
    switch (status) {
      case SaleStatus.RESERVED:
        
        // Validate quantity if provided
        if (updateData.quantity) {
          if (updateData.quantity <= 0) {
            throw new BadRequestException('Quantity must be greater than 0');
          }
          if (updateData.quantity > sale.quantity) {
            throw new BadRequestException('Requested quantity exceeds available stock');
          }
        }
        
        // Assign buyerId from token if not provided
        if (!updateData.buyerId && req.user?.id) {
          updateData.buyerId = req.user.id;
        }
        
        if (!updateData.buyerId) {
          throw new BadRequestException('Buyer ID is required for reservation');
        }
        break;

      case SaleStatus.SHIPPED:
        if (shippingProof) {
          updateData.shippingProofUrl = await this.salesService.uploadShippingProof(shippingProof);
        }
        if (!updateData.shippingProofUrl) {
          throw new BadRequestException('Shipping proof URL or file is required');
        }
        break;

      case SaleStatus.DELIVERED:
        if (deliveryProof) {
          updateData.deliveryProofUrl = await this.salesService.uploadDeliveryProof(deliveryProof);
        }
        if (!updateData.deliveryProofUrl) {
          throw new BadRequestException('Delivery proof URL or file is required');
        }
        break;

      case SaleStatus.CANCELLED:
        if (!updateData.reason) {
          throw new BadRequestException('Cancellation reason is required');
        }
        break;
    }

    // Procesar la actualización según el estado
    switch (status) {
      case SaleStatus.RESERVED:
        return this.salesStateService.reserveSale(
          { saleId, ...updateData },
          req.user.id,
        );
      case SaleStatus.SHIPPED:
        return this.salesStateService.shipSale(
          { saleId, ...updateData },
          req.user.id,
        );
      case SaleStatus.DELIVERED:
        return this.salesStateService.confirmDelivery(
          { saleId, ...updateData },
          req.user.id,
        );
      case SaleStatus.COMPLETED:
        return this.salesStateService.completeSale(saleId, req.user.id);
      case SaleStatus.CANCELLED:
        return this.salesStateService.cancelSale(
          { saleId, ...updateData },
          req.user.id,
        );
      default:
        throw new BadRequestException('Invalid status');
    }
  }

  @Get('metrics')
  @ApiOperation({ 
    summary: 'Get sales metrics',
    description: 'Returns comprehensive sales metrics including revenue, conversion rates, and performance by category and store'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Sales metrics retrieved successfully',
    type: SalesMetricsDto
  })
  @ApiQuery({ 
    name: 'start_date', 
    required: false, 
    type: Date, 
    description: 'Start date for metrics calculation (ISO format)' 
  })
  @ApiQuery({ 
    name: 'end_date', 
    required: false, 
    type: Date, 
    description: 'End date for metrics calculation (ISO format)' 
  })
  async getSalesMetrics(
    @Request() req,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ): Promise<SalesMetricsDto> {
    return this.salesMetricsService.getSalesMetrics(
      req.user.id,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('reports')
  @ApiOperation({ 
    summary: 'Get basic sales reports',
    description: 'Returns detailed sales reports including metrics by period, category, store, and status'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Reports generated successfully',
    type: SalesReportDto
  })
  @ApiQuery({ 
    name: 'start_date', 
    required: false, 
    type: Date, 
    description: 'Start date for the report (ISO format)' 
  })
  @ApiQuery({ 
    name: 'end_date', 
    required: false, 
    type: Date, 
    description: 'End date for the report (ISO format)' 
  })
  @ApiQuery({ 
    name: 'category_ids', 
    required: false, 
    type: [String], 
    description: 'IDs of categories to include' 
  })
  @ApiQuery({ 
    name: 'store_ids', 
    required: false, 
    type: [String], 
    description: 'IDs of stores to include' 
  })
  @ApiQuery({ 
    name: 'group_by', 
    required: false, 
    enum: ['day', 'week', 'month'],
    description: 'Group by day/week/month' 
  })
  @ApiQuery({ 
    name: 'limit', 
    required: false, 
    type: Number,
    description: 'Limit of results for categories/stores' 
  })
  async getSalesReports(
    @Request() req,
    @Query() filters: SalesReportFilterDto,
  ): Promise<SalesReportDto> {
    return this.salesReportService.generateReport(req.user.id, filters);
  }
}
