import { IsString, IsEnum, IsOptional, IsBoolean } from 'class-validator';

export class CreateBadgeDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsEnum(['user', 'store'])
  type: 'user' | 'store';

  @IsEnum(['level', 'reputation', 'plan', 'volume', 'quality', 'specialty'])
  category: 'level' | 'reputation' | 'plan' | 'volume' | 'quality' | 'specialty';

  @IsString()
  iconUrl: string;

  // Criteria is a JSON object, validation can be custom if needed
  criteria: any;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
} 