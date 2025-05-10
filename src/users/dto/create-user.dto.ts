import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { Role } from '../../common/enums/roles.enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'Juan Pérez', description: 'Nombre completo del usuario' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'juan@example.com', description: 'Correo electrónico del usuario' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({ example: 'Password123', description: 'Contraseña del usuario (mínimo 8 caracteres)' })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @ApiPropertyOptional({ enum: Role, description: 'Rol del usuario' })
  @IsOptional()
  role?: Role;

  @ApiPropertyOptional({ example: 'https://cdn.com/avatar.jpg', description: 'URL del avatar del usuario' })
  @IsOptional()
  @IsString()
  avatar_url?: string;
}