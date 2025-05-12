import { Controller, Post, Body, Get, Param, UseGuards, Req } from '@nestjs/common';
import { RatingsService } from './ratings.service';
import { CreateUserRatingDto } from './dto/create-user-rating.dto';
import { CreateStoreRatingDto } from './dto/create-store-rating.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Asegúrate de tener un guard de autenticación
import { Request as ExpressRequest } from 'express';

interface AuthRequest extends ExpressRequest {
  user: { id: string; [key: string]: any };
}

@Controller('ratings')
@UseGuards(JwtAuthGuard) // Protege los endpoints con autenticación
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Post('user')
  async createUserRating(@Body() createUserRatingDto: CreateUserRatingDto, @Req() req: AuthRequest) {
    return this.ratingsService.createUserRating(createUserRatingDto, req.user.id);
  }

  @Post('store')
  async createStoreRating(@Body() createStoreRatingDto: CreateStoreRatingDto, @Req() req: AuthRequest) {
    return this.ratingsService.createStoreRating(createStoreRatingDto, req.user.id);
  }

  @Get('user/:userId')
  async getUserRatings(@Param('userId') userId: string) {
    return this.ratingsService.getUserRatings(userId);
  }

  @Get('store/:storeId')
  async getStoreRatings(@Param('storeId') storeId: string) {
    return this.ratingsService.getStoreRatings(storeId);
  }
}
