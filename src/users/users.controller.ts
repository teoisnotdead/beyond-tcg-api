import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, ForbiddenException, UseInterceptors, UploadedFile } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/roles.enum';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CommentsService } from '../comments/comments.service';
import { Platform, Channel } from '../common/headers/decorators/headers.decorator';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly commentsService: CommentsService,
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
  async getProfile(@Request() req) {
    const user = await this.usersService.findOne(req.user.id);
    const tier = await this.usersService.getCurrentTier(user.id);
    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        is_store: user.is_store,
        google_id: user.google_id,
        avatar_url: user.avatar_url,
        created_at: user.created_at,
        updated_at: user.updated_at,
        tier,
      }
    };
  }

  @Get('search')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Search users by term, role, pagination and offset' })
  @ApiResponse({ status: 200, description: 'Users found.' })
  async searchUsers(@Request() req) {
    const { search, page = 1, limit = 20, offset, roles } = req.query;
    return this.usersService.searchUsers({ search, page: Number(page), limit: Number(limit), offset: offset !== undefined ? Number(offset) : undefined, roles });
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
  @UseInterceptors(FileInterceptor('avatar'))
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({ status: 200, description: 'User updated successfully.' })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req,
    @UploadedFile() avatar?: Express.Multer.File
  ) {
    if (req.user.id !== id && req.user.role !== Role.ADMIN) {
      throw new ForbiddenException('You are not allowed to update this user');
    }
    return this.usersService.update(id, updateUserDto, avatar);
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

  @Get(':id/comments-authored')
  @ApiOperation({ summary: 'Get all comments authored by this user', tags: ['users'] })
  getCommentsAuthoredByUser(@Param('id') id: string) {
    return this.commentsService.findAllByAuthor(id);
  }

  @Get('profile/metadata')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get user profile metadata with headers information' })
  @ApiResponse({ status: 200, description: 'User profile metadata retrieved successfully.' })
  async getProfileMetadata(
    @Request() req,
    @Platform() platform: string,
    @Channel() channel: string,
  ) {
    const user = await this.usersService.findOne(req.user.id);
    const tier = await this.usersService.getCurrentTier(user.id);
    
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tier,
      },
      metadata: {
        platform,
        channel,
        requestTimestamp: new Date().toISOString(),
      },
    };
  }
}