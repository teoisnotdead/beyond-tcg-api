import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateStoreBrandingDto {
  @ApiPropertyOptional({ type: 'string', format: 'binary', description: 'Store logo' })
  @IsOptional()
  logo?: any;

  @ApiPropertyOptional({ type: 'string', format: 'binary', description: 'Store banner' })
  @IsOptional()
  banner?: any;
} 