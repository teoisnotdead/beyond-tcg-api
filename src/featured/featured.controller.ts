import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FeaturedService } from './featured.service';

@ApiTags('featured')
@Controller('featured')
export class FeaturedController {
  constructor(private readonly featuredService: FeaturedService) {}

  @Get()
  @ApiOperation({ summary: 'Get featured stores and users (according to their plan)' })
  @ApiResponse({ status: 200, description: 'List of featured stores and users.' })
  async getFeatured() {
    return this.featuredService.getFeatured();
  }
} 
