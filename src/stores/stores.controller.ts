import { Controller, Post, Body, UseGuards, Request, Get, Param, ForbiddenException } from '@nestjs/common';
import { StoresService } from './stores.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';
import { SubscriptionValidationService } from '../subscriptions/subscription-validation.service';
import { CommentsService } from '../comments/comments.service';

interface AuthRequest extends ExpressRequest {
  user: { id: string; [key: string]: any };
}

@ApiTags('stores')
@ApiBearerAuth()
@Controller('stores')
@UseGuards(JwtAuthGuard)
export class StoresController {
  constructor(
    private readonly storesService: StoresService,
    private readonly subscriptionValidationService: SubscriptionValidationService,
    private readonly commentsService: CommentsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new store' })
  @ApiResponse({ status: 201, description: 'Store created successfully.' })
  async create(@Request() req: AuthRequest, @Body() createStoreDto: CreateStoreDto) {
    const canCreate = await this.subscriptionValidationService.canCreateStore(req.user.id);
    if (!canCreate) {
      throw new ForbiddenException('Your subscription plan does not allow you to create a store.');
    }
    return this.storesService.create(req.user.id, createStoreDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all stores' })
  @ApiResponse({ status: 200, description: 'Stores retrieved successfully.' })
  findAll() {
    return this.storesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get store by ID' })
  @ApiResponse({ status: 200, description: 'Store retrieved successfully.' })
  findOne(@Param('id') id: string) {
    return this.storesService.findOne(id);
  }

  @Get(':id/comments')
  @ApiOperation({ summary: 'Get all comments for this store' })
  getCommentsForStore(@Param('id') id: string) {
    return this.commentsService.findAllForStore(id);
  }

  @Get(':id/statistics')
  @ApiOperation({ summary: 'Get store statistics' })
  async getStoreStatistics(@Param('id') storeId: string, @Request() req: AuthRequest) {
    // Validate user plan
    const features = await this.subscriptionValidationService.getUserFeatures(req.user.id);
    if (!features.statistics) {
      throw new ForbiddenException('Your plan does not allow you to see statistics');
    }
    return this.storesService.getStatistics(storeId);
  }
}
