import { UsersService } from './users.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

const createMockRepository = () => ({} as any);
const createMockEventEmitter = () => ({ emit: jest.fn() }) as unknown as EventEmitter2;
const createMockCloudinaryService = () => ({
  updateImage: jest.fn(),
  deleteImage: jest.fn(),
}) as unknown as CloudinaryService;

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    service = new UsersService(
      createMockRepository(),
      createMockRepository(),
      createMockRepository(),
      createMockRepository(),
      createMockRepository(),
      createMockRepository(),
      createMockEventEmitter(),
      createMockCloudinaryService(),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
