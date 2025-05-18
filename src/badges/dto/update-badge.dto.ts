import { IsString, IsEnum, IsOptional, IsBoolean } from 'class-validator';

export class UpdateBadgeDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(['user', 'store'])
  type?: 'user' | 'store';

  @IsOptional()
  @IsEnum(['level', 'reputation', 'plan', 'volume', 'quality', 'specialty'])
  category?: 'level' | 'reputation' | 'plan' | 'volume' | 'quality' | 'specialty';

  @IsOptional()
  @IsString()
  iconUrl?: string;

  // Criteria is a JSON object, validation can be custom if needed
  @IsOptional()
  criteria?: any;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
} 