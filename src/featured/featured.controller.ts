import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FeaturedService } from './featured.service';

@ApiTags('featured')
@ApiBearerAuth()
@Controller('featured')
@UseGuards(JwtAuthGuard)
export class FeaturedController {
  constructor(private readonly featuredService: FeaturedService) {}

  @Get()
  @ApiOperation({ summary: 'Get featured stores and users (according to their plan)' })
  @ApiResponse({ status: 200, description: 'List of featured stores and users.' })
  async getFeatured() {
    return this.featuredService.getFeatured();
  }
} 