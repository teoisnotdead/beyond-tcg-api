import { Controller, Post, Body, UseGuards, Request, Get, Param } from '@nestjs/common';
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
@UseGuards(JwtAuthGuard)
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new comment or review', tags: ['comments'] })
  @ApiResponse({ status: 201, description: 'Comment created successfully.' })
  create(@Request() req: AuthRequest, @Body() createCommentDto: CreateCommentDto) {
    return this.commentsService.create(req.user.id, createCommentDto);
  }

  @Get('sale/:saleId')
  @ApiOperation({ summary: 'Get all comments for a sale', tags: ['comments'] })
  findAllForSale(@Param('saleId') saleId: string) {
    return this.commentsService.findAllForSale(saleId);
  }

  @Get('store/:storeId')
  @ApiOperation({ summary: 'Get all comments for a store', tags: ['comments'] })
  findAllForStore(@Param('storeId') storeId: string) {
    return this.commentsService.findAllForStore(storeId);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get all comments for a user', tags: ['comments'] })
  findAllForUser(@Param('userId') userId: string) {
    return this.commentsService.findAllForUser(userId);
  }
}
