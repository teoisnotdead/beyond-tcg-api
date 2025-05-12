import { Controller, Post, Body, Get, Param, UseGuards, Req } from '@nestjs/common';
import { RatingsService } from './ratings.service';
import { CreateUserRatingDto } from './dto/create-user-rating.dto';
import { CreateStoreRatingDto } from './dto/create-store-rating.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';

interface AuthRequest extends ExpressRequest {
  user: { id: string; [key: string]: any };
}

@ApiTags('ratings')
@ApiBearerAuth()
@Controller('ratings')
@UseGuards(JwtAuthGuard)
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Post('user')
  @ApiOperation({ summary: 'Crear un rating para un usuario' })
  @ApiResponse({ status: 201, description: 'Rating creado exitosamente' })
  @ApiResponse({ status: 400, description: 'No puedes calificarte a ti mismo o ya calificaste esta venta' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async createUserRating(@Body() createUserRatingDto: CreateUserRatingDto, @Req() req: AuthRequest) {
    return this.ratingsService.createUserRating(createUserRatingDto, req.user.id);
  }

  @Post('store')
  @ApiOperation({ summary: 'Crear un rating para una tienda' })
  @ApiResponse({ status: 201, description: 'Rating creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Ya calificaste esta venta para esta tienda' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async createStoreRating(@Body() createStoreRatingDto: CreateStoreRatingDto, @Req() req: AuthRequest) {
    return this.ratingsService.createStoreRating(createStoreRatingDto, req.user.id);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Obtener todos los ratings recibidos por un usuario' })
  @ApiResponse({ status: 200, description: 'Lista de ratings del usuario' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getUserRatings(@Param('userId') userId: string) {
    return this.ratingsService.getUserRatings(userId);
  }

  @Get('store/:storeId')
  @ApiOperation({ summary: 'Obtener todos los ratings recibidos por una tienda' })
  @ApiResponse({ status: 200, description: 'Lista de ratings de la tienda' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getStoreRatings(@Param('storeId') storeId: string) {
    return this.ratingsService.getStoreRatings(storeId);
  }

  @Get('user/:userId/average')
  @ApiOperation({ summary: 'Obtener el promedio de ratings de un usuario' })
  @ApiResponse({ status: 200, description: 'Promedio de ratings del usuario' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getUserAverageRating(@Param('userId') userId: string) {
    const avg = await this.ratingsService.getUserAverageRating(userId);
    return { userId, average: avg };
  }

  @Get('store/:storeId/average')
  @ApiOperation({ summary: 'Obtener el promedio de ratings de una tienda' })
  @ApiResponse({ status: 200, description: 'Promedio de ratings de la tienda' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getStoreAverageRating(@Param('storeId') storeId: string) {
    const avg = await this.ratingsService.getStoreAverageRating(storeId);
    return { storeId, average: avg };
  }
}
