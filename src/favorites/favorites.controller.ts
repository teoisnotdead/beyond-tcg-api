import { Controller, Post, Body, UseGuards, Request, Delete, Param, Get } from '@nestjs/common';
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
  @ApiOperation({ summary: 'Add a sale to favorites' })
  @ApiResponse({ status: 201, description: 'Sale added to favorites successfully.' })
  create(@Request() req: AuthRequest, @Body() createFavoriteDto: CreateFavoriteDto) {
    return this.favoritesService.create(req.user.id, createFavoriteDto);
  }

  @Delete(':saleId')
  @ApiOperation({ summary: 'Remove a sale from favorites' })
  removeFavorite(@Request() req: AuthRequest, @Param('saleId') saleId: string) {
    return this.favoritesService.removeFavorite(req.user.id, saleId);
  }

  @Get()
  @ApiOperation({ summary: 'Get user favorites' })
  getUserFavorites(@Request() req: AuthRequest) {
    return this.favoritesService.getUserFavorites(req.user.id);
  }
} 