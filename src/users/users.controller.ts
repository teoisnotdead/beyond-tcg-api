import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/roles.enum';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CommentsService } from '../comments/comments.service';
import { SubscriptionValidationService } from '../subscriptions/subscription-validation.service';
import { Platform, UserRole, SubscriptionTier, Channel } from '../common/headers/decorators/headers.decorator';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly commentsService: CommentsService,
    private readonly subscriptionValidationService: SubscriptionValidationService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a new user (admin only)' })
  @ApiResponse({ status: 201, description: 'User created successfully.' })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get all users (admin only)' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findAll(@Request() req) {
    const { page = 1, limit = 20, ...filters } = req.query;
    return this.usersService.findAll(Number(page), Number(limit), filters);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get authenticated user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getProfile(@Request() req) {
    return this.usersService.findOne(req.user.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({ status: 200, description: 'User updated successfully.' })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete user (admin only)' })
  @ApiResponse({ status: 200, description: 'User deleted successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Get(':id/comments')
  @ApiOperation({ summary: 'Get all comments for this user', tags: ['users'] })
  getCommentsForUser(@Param('id') id: string) {
    return this.commentsService.findAllForUser(id);
  }

  @Get(':id/statistics')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get user statistics' })
  async getUserStatistics(@Param('id') userId: string, @Request() req) {
    // Validate user plan
    const features = await this.subscriptionValidationService.getUserFeatures(req.user.id);
    if (!features.statistics) {
      throw new ForbiddenException('Your plan does not allow you to see statistics');
    }
    return this.usersService.getStatistics(userId);
  }

  @Get('search')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Buscar usuarios por término, rol, paginación y offset' })
  @ApiResponse({ status: 200, description: 'Usuarios encontrados.' })
  async searchUsers(@Request() req) {
    const { search, page = 1, limit = 20, offset, roles } = req.query;
    return this.usersService.searchUsers({ search, page: Number(page), limit: Number(limit), offset: offset !== undefined ? Number(offset) : undefined, roles });
  }

  @Get('profile/metadata')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get user profile metadata with headers information' })
  @ApiResponse({ status: 200, description: 'User profile metadata retrieved successfully.' })
  async getProfileMetadata(
    @Request() req,
    @Platform() platform: string,
    @UserRole() role: string,
    @SubscriptionTier() tier: string,
    @Channel() channel: string,
  ) {
    const user = await this.usersService.findOne(req.user.id);
    
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      metadata: {
        platform,
        role,
        tier,
        channel,
        requestTimestamp: new Date().toISOString(),
      },
    };
  }
}