import { Controller, Post, Delete, Get, Body, Param, UseGuards, Req } from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { CreateFavoriteDto } from './dto/create-favorite.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';

interface AuthRequest extends ExpressRequest {
  user: { id: string; [key: string]: any };
}

@ApiTags('favorites')
@ApiBearerAuth()
@Controller('favorites')
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post()
  @ApiOperation({ summary: 'Add a sale to user favorites' })
  @ApiResponse({ status: 201, description: 'Favorite added successfully' })
  @ApiResponse({ status: 400, description: 'Sale already in favorites' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async addFavorite(@Body() createFavoriteDto: CreateFavoriteDto, @Req() req: AuthRequest) {
    return this.favoritesService.addFavorite(req.user.id, createFavoriteDto);
  }

  @Delete(':saleId')
  @ApiOperation({ summary: 'Remove a sale from user favorites' })
  @ApiResponse({ status: 200, description: 'Favorite removed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async removeFavorite(@Param('saleId') saleId: string, @Req() req: AuthRequest) {
    await this.favoritesService.removeFavorite(req.user.id, saleId);
    return { message: 'Favorite removed successfully' };
  }

  @Get()
  @ApiOperation({ summary: 'Get all user favorites' })
  @ApiResponse({ status: 200, description: 'List of user favorites' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserFavorites(@Req() req: AuthRequest) {
    return this.favoritesService.getUserFavorites(req.user.id);
  }
} 