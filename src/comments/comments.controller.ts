import { Controller, Post, Body, UseGuards, Request, Get, Param, Delete } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';

interface AuthRequest extends ExpressRequest {
  user: { id: string; [key: string]: any };
}

@ApiTags('comments')
@ApiBearerAuth()
@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a new comment or review' })
  @ApiResponse({ status: 201, description: 'Comment created successfully.' })
  create(@Request() req: AuthRequest, @Body() createCommentDto: CreateCommentDto) {
    return this.commentsService.create(req.user.id, createCommentDto);
  }

  @Get('sale/:saleId')
  @ApiOperation({ summary: 'Get all comments for a sale' })
  findAllForSale(@Param('saleId') saleId: string) {
    return this.commentsService.findAllForSale(saleId);
  }

  @Post('sale/:saleId/subscribe')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Subscribe to sale comments notifications' })
  async subscribeToSaleComments(@Request() req: AuthRequest, @Param('saleId') saleId: string) {
    const subscription = await this.commentsService.subscribeToSaleComments(req.user.id, saleId);
    return {
      message: 'Subscribed to sale comments successfully',
      data: subscription,
    };
  }

  @Delete('sale/:saleId/subscribe')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Unsubscribe from sale comments notifications' })
  async unsubscribeFromSaleComments(@Request() req: AuthRequest, @Param('saleId') saleId: string) {
    await this.commentsService.unsubscribeFromSaleComments(req.user.id, saleId);
    return {
      message: 'Unsubscribed from sale comments successfully',
    };
  }

  @Get('store/:storeId')
  @ApiOperation({ summary: 'Get all comments for a store' })
  findAllForStore(@Param('storeId') storeId: string) {
    return this.commentsService.findAllForStore(storeId);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get all comments for a user' })
  findAllForUser(@Param('userId') userId: string) {
    return this.commentsService.findAllForUser(userId);
  }
}
