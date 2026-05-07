import { PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
import { IsOptional, IsString, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiPropertyOptional({ description: 'Current subscription ID' })
  @IsOptional()
  @IsString()
  current_subscription_id?: string;

  @ApiPropertyOptional({ description: 'Whether user has store account enabled' })
  @IsOptional()
  @IsBoolean()
  is_store?: boolean;
}
