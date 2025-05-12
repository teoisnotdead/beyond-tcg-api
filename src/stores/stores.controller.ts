import { Controller, Post, Body, UseGuards, Request, Get, Param, ForbiddenException } from '@nestjs/common';
import { StoresService } from './stores.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';
import { SubscriptionValidationService } from '../subscriptions/subscription-validation.service';

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
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new store', tags: ['stores'] })
  @ApiResponse({ status: 201, description: 'Store created successfully.' })
  async create(@Request() req: AuthRequest, @Body() createStoreDto: CreateStoreDto) {
    const canCreate = await this.subscriptionValidationService.canCreateStore(req.user.id);
    if (!canCreate) {
      throw new ForbiddenException('Your subscription plan does not allow you to create a store.');
    }
    return this.storesService.create(req.user.id, createStoreDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all stores', tags: ['stores'] })
  @ApiResponse({ status: 200, description: 'Stores retrieved successfully.' })
  findAll() {
    return this.storesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get store by ID', tags: ['stores'] })
  @ApiResponse({ status: 200, description: 'Store retrieved successfully.' })
  findOne(@Param('id') id: string) {
    return this.storesService.findOne(id);
  }
}
