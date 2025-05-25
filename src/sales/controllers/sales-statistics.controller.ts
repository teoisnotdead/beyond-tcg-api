import { Controller, Get, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiProperty } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/roles.enum';
import { SalesStatisticsService } from '../services/sales-statistics.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { UserSubscription } from '../../subscriptions/entities/user-subscription.entity';
import { SubscriptionPlan } from '../../subscriptions/entities/subscription-plan.entity';

// DTOs for Swagger documentation
class SalesMetricsDto {
  @ApiProperty({ description: 'Number of active listings' })
  active_listings: number;

  @ApiProperty({ description: 'Number of completed sales' })
  completed_sales: number;

  @ApiProperty({ description: 'Number of cancelled sales' })
  cancelled_sales: number;

  @ApiProperty({ description: 'Average price of sales' })
  average_sale_price: number;

  @ApiProperty({ description: 'Average time to sell in hours' })
  average_time_to_sell: number;

  @ApiProperty({ description: 'Sales conversion rate percentage' })
  conversion_rate: number;
}

class CategoryPreferenceDto {
  @ApiProperty({ description: 'Category identifier' })
  category_id: string;

  @ApiProperty({ description: 'Category name' })
  category_name: string;

  @ApiProperty({ description: 'Number of purchases in this category' })
  purchase_count: number;

  @ApiProperty({ description: 'Total amount spent in this category' })
  total_spent: number;
}

class PurchaseMetricsDto {
  @ApiProperty({ description: 'Total number of orders placed' })
  total_orders: number;

  @ApiProperty({ description: 'Average value per order' })
  average_order_value: number;

  @ApiProperty({ description: 'Most purchased categories' })
  favorite_categories: CategoryPreferenceDto[];
}

class ActivityMetricsDto {
  @ApiProperty({ description: 'Last activity timestamp' })
  last_activity: Date;

  @ApiProperty({ description: 'Average response time in hours' })
  average_response_time: number;

  @ApiProperty({ description: 'Transaction completion rate percentage' })
  completion_rate: number;

  @ApiProperty({ description: 'Transaction cancellation rate percentage' })
  cancellation_rate: number;
}

class DailyDataDto {
  @ApiProperty({ description: 'Date of activity' })
  date: string;

  @ApiProperty({ description: 'Number of transactions' })
  count: number;

  @ApiProperty({ description: 'Amount for the day' })
  revenue?: number;

  @ApiProperty({ description: 'Amount spent for the day' })
  spent?: number;
}

class RecentTrendsDto {
  @ApiProperty({ description: 'Daily sales data for the last 30 days' })
  daily_sales: DailyDataDto[];

  @ApiProperty({ description: 'Daily purchase data for the last 30 days' })
  daily_purchases: DailyDataDto[];
}

class UserStatisticsDto {
  @ApiProperty({ description: 'Total number of sales made by the user' })
  total_sales: number;

  @ApiProperty({ description: 'Total number of purchases made by the user' })
  total_purchases: number;

  @ApiProperty({ description: 'Total revenue from sales' })
  total_revenue: number;

  @ApiProperty({ description: 'Total amount spent on purchases' })
  total_spent: number;

  @ApiProperty({ description: 'Average rating received by the user' })
  average_rating: number;

  @ApiProperty({ description: 'Sales performance metrics', type: SalesMetricsDto })
  sales_metrics: SalesMetricsDto;

  @ApiProperty({ description: 'Purchase behavior metrics', type: PurchaseMetricsDto })
  purchase_metrics: PurchaseMetricsDto;

  @ApiProperty({ description: 'User activity metrics', type: ActivityMetricsDto })
  activity_metrics: ActivityMetricsDto;

  @ApiProperty({ description: 'Recent activity trends', type: RecentTrendsDto })
  recent_trends: RecentTrendsDto;
}

@ApiTags('Sales Statistics')
@Controller('sales/statistics')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SalesStatisticsController {
  constructor(
    private readonly statisticsService: SalesStatisticsService,
    @InjectRepository(UserSubscription)
    private readonly userSubscriptionRepository: Repository<UserSubscription>,
    @InjectRepository(SubscriptionPlan)
    private readonly subscriptionPlanRepository: Repository<SubscriptionPlan>,
  ) {}

  /**
   * Validates if the user has an active subscription with statistics access
   * @param userId - The ID of the user to validate
   * @returns boolean indicating if the user has access
   */
  private async validateSubscriptionAccess(userId: string): Promise<boolean> {
    const subscription = await this.userSubscriptionRepository.findOne({
      where: { 
        user_id: userId,
        is_active: true,
        end_date: MoreThan(new Date())
      },
      relations: ['plan']
    });

    if (!subscription) {
      return false;
    }

    // Check if the plan includes statistics access
    const plan = await this.subscriptionPlanRepository.findOne({
      where: { id: subscription.plan_id }
    });

    return plan?.features?.has_statistics === true;
  }

  @Get('user')
  @Roles(Role.USER)
  @ApiOperation({ summary: 'Get user statistics' })
  @ApiResponse({ 
    status: 200, 
    description: 'User statistics retrieved successfully',
    type: UserStatisticsDto 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Access denied - Active subscription required' 
  })
  async getUserStatistics(@Request() req) {
    const hasAccess = await this.validateSubscriptionAccess(req.user.id);
    
    if (!hasAccess) {
      throw new ForbiddenException(
        'An active subscription is required to access statistics'
      );
    }

    return this.statisticsService.getUserStatistics(req.user.id);
  }

  @Get('store')
  @Roles(Role.USER)
  @ApiOperation({ summary: 'Get store statistics' })
  @ApiResponse({ 
    status: 200, 
    description: 'Store statistics retrieved successfully',
    type: UserStatisticsDto 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Access denied - Store subscription required' 
  })
  async getStoreStatistics(@Request() req) {
    // Verify if the user is a store
    if (!req.user.is_store) {
      throw new ForbiddenException(
        'This endpoint is only available for store accounts'
      );
    }

    const hasAccess = await this.validateSubscriptionAccess(req.user.id);
    
    if (!hasAccess) {
      throw new ForbiddenException(
        'An active store subscription is required to access statistics'
      );
    }

    return this.statisticsService.getUserStatistics(req.user.id);
  }
} 