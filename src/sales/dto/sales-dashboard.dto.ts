import { ApiProperty } from '@nestjs/swagger';

class DashboardMetricCardDto {
  @ApiProperty({ description: 'Count of sales in this bucket' })
  count: number;

  @ApiProperty({ description: 'Total amount for this bucket' })
  amount: number;
}

class DashboardCardsDto {
  @ApiProperty({ type: DashboardMetricCardDto })
  available: DashboardMetricCardDto;

  @ApiProperty({ type: DashboardMetricCardDto })
  reserved: DashboardMetricCardDto;

  @ApiProperty({ type: DashboardMetricCardDto })
  shipped: DashboardMetricCardDto;

  @ApiProperty({ type: DashboardMetricCardDto })
  completed_30d: DashboardMetricCardDto;

  @ApiProperty({ type: DashboardMetricCardDto })
  cancelled_30d: DashboardMetricCardDto;
}

class PendingActionsDto {
  @ApiProperty({ type: DashboardMetricCardDto })
  to_ship: DashboardMetricCardDto;

  @ApiProperty({ type: DashboardMetricCardDto })
  to_confirm_delivery: DashboardMetricCardDto;
}

class DashboardTotalsDto {
  @ApiProperty({ description: 'Total count of active listings (available+reserved+shipped)' })
  listings_count: number;

  @ApiProperty({ description: 'Total amount of active listings (available+reserved+shipped)' })
  listings_amount: number;
}

export class SalesDashboardDto {
  @ApiProperty({ type: DashboardCardsDto })
  cards: DashboardCardsDto;

  @ApiProperty({ type: PendingActionsDto })
  pending_actions: PendingActionsDto;

  @ApiProperty({ type: DashboardTotalsDto })
  totals: DashboardTotalsDto;
}
