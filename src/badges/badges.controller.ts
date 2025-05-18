import { Controller, Get, Param, Post, Body, Delete, UseGuards, Put, UsePipes, ValidationPipe } from '@nestjs/common';
import { BadgesService } from './badges.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateBadgeDto } from './dto/create-badge.dto';
import { UpdateBadgeDto } from './dto/update-badge.dto';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('badges')
@ApiBearerAuth()
@Controller('badges')
export class BadgesController {
  constructor(private readonly badgesService: BadgesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all active badges' })
  @ApiResponse({ status: 200, description: 'List of all active badges.' })
  findAll() {
    return this.badgesService.findAllBadges();
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get all badges for a user' })
  @ApiResponse({ status: 200, description: 'List of badges for the user.' })
  findUserBadges(@Param('userId') userId: string) {
    return this.badgesService.findUserBadges(userId);
  }

  @Get('store/:storeId')
  @ApiOperation({ summary: 'Get all badges for a store' })
  @ApiResponse({ status: 200, description: 'List of badges for the store.' })
  findStoreBadges(@Param('storeId') storeId: string) {
    return this.badgesService.findStoreBadges(storeId);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @ApiOperation({ summary: 'Create a new badge' })
  @ApiResponse({ status: 201, description: 'Badge created successfully.' })
  createBadge(@Body() dto: CreateBadgeDto) {
    return this.badgesService.createBadge(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @ApiOperation({ summary: 'Update a badge' })
  @ApiResponse({ status: 200, description: 'Badge updated successfully.' })
  updateBadge(@Param('id') id: string, @Body() dto: UpdateBadgeDto) {
    return this.badgesService.updateBadge(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('user/:userId/:badgeId')
  @ApiOperation({ summary: 'Assign a badge to a user' })
  @ApiResponse({ status: 201, description: 'Badge assigned to user.' })
  assignBadgeToUser(@Param('userId') userId: string, @Param('badgeId') badgeId: string, @Body('metadata') metadata?: any) {
    return this.badgesService.assignBadgeToUser(userId, badgeId, metadata);
  }

  @UseGuards(JwtAuthGuard)
  @Post('store/:storeId/:badgeId')
  @ApiOperation({ summary: 'Assign a badge to a store' })
  @ApiResponse({ status: 201, description: 'Badge assigned to store.' })
  assignBadgeToStore(@Param('storeId') storeId: string, @Param('badgeId') badgeId: string, @Body('metadata') metadata?: any) {
    return this.badgesService.assignBadgeToStore(storeId, badgeId, metadata);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('user/:userId/:badgeId')
  @ApiOperation({ summary: 'Remove a badge from a user' })
  @ApiResponse({ status: 200, description: 'Badge removed from user.' })
  removeBadgeFromUser(@Param('userId') userId: string, @Param('badgeId') badgeId: string) {
    return this.badgesService.removeBadgeFromUser(userId, badgeId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('store/:storeId/:badgeId')
  @ApiOperation({ summary: 'Remove a badge from a store' })
  @ApiResponse({ status: 200, description: 'Badge removed from store.' })
  removeBadgeFromStore(@Param('storeId') storeId: string, @Param('badgeId') badgeId: string) {
    return this.badgesService.removeBadgeFromStore(storeId, badgeId);
  }
} 