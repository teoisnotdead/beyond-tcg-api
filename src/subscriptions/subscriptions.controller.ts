import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/roles.enum';

@ApiTags('subscriptions')
@ApiBearerAuth()
@Controller('subscriptions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('plans')
  @ApiOperation({ summary: 'Get all available subscription plans' })
  @ApiResponse({ status: 200, description: 'List of subscription plans retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getAllPlans() {
    return this.subscriptionsService.getAllPlans();
  }

  @Get('plans/:id')
  @ApiOperation({ summary: 'Get subscription plan by ID' })
  @ApiResponse({ status: 200, description: 'Subscription plan found successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Subscription plan not found' })
  getPlanById(@Param('id') id: string) {
    return this.subscriptionsService.getPlanById(id);
  }

  @Get('current')
  @ApiOperation({ summary: 'Get current user subscription' })
  @ApiResponse({ status: 200, description: 'Current subscription retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'No active subscription found' })
  getCurrentSubscription(@Request() req) {
    return this.subscriptionsService.getCurrentSubscription(req.user.id);
  }

  @Post('upgrade/:planId')
  @ApiOperation({ summary: 'Upgrade user subscription to a new plan' })
  @ApiResponse({ status: 200, description: 'Subscription upgraded successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  @ApiResponse({ status: 400, description: 'Invalid plan or plan not available' })
  upgradeSubscription(@Request() req, @Param('planId') planId: string) {
    return this.subscriptionsService.upgradeSubscription(req.user.id, planId);
  }
} 