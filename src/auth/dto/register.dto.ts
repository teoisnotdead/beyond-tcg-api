import { CreateUserDto } from '../../users/dto/create-user.dto';
import { ApiExtraModels } from '@nestjs/swagger';

@ApiExtraModels(CreateUserDto)
export class RegisterDto extends CreateUserDto {}