import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LanguagesService } from './languages.service';
import { CreateLanguageDto } from './dto/create-language.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('languages')
@Controller('languages')
@UseGuards(JwtAuthGuard)
export class LanguagesController {
  constructor(private readonly languagesService: LanguagesService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo idioma' })
  @ApiResponse({ status: 201, description: 'Idioma creado exitosamente' })
  create(@Body() createLanguageDto: CreateLanguageDto) {
    return this.languagesService.create(createLanguageDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los idiomas' })
  @ApiResponse({ status: 200, description: 'Lista de idiomas obtenida exitosamente' })
  findAll() {
    return this.languagesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un idioma por ID' })
  @ApiResponse({ status: 200, description: 'Idioma encontrado exitosamente' })
  findOne(@Param('id') id: string) {
    return this.languagesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un idioma' })
  @ApiResponse({ status: 200, description: 'Idioma actualizado exitosamente' })
  update(@Param('id') id: string, @Body() updateLanguageDto: CreateLanguageDto) {
    return this.languagesService.update(id, updateLanguageDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un idioma' })
  @ApiResponse({ status: 200, description: 'Idioma eliminado exitosamente' })
  remove(@Param('id') id: string) {
    return this.languagesService.remove(id);
  }
} 