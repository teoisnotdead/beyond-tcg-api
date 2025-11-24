import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CommentsService } from './comments.service';
import { Comment } from './entities/comment.entity';
import { CommentSubscription } from './entities/comment-subscription.entity';
import { NotificationsService } from '../notifications/notifications.service';

const createMockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
});

const mockNotificationsService = {
  create: jest.fn(),
};

describe('CommentsService', () => {
  let service: CommentsService;
  let subscriptionRepository: ReturnType<typeof createMockRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsService,
        { provide: getRepositoryToken(Comment), useValue: createMockRepository() },
        {
          provide: getRepositoryToken(CommentSubscription),
          useValue: createMockRepository(),
        },
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();

    service = module.get<CommentsService>(CommentsService);
    subscriptionRepository = module.get(getRepositoryToken(CommentSubscription));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return the same subscription when the user comments multiple times on the same sale', async () => {
    const userId = 'user-1';
    const saleId = 'sale-1';
    const savedSubscription = { id: 'sub-1', user: { id: userId }, sale: { id: saleId } } as CommentSubscription;

    subscriptionRepository.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(savedSubscription);

    subscriptionRepository.create.mockReturnValue(savedSubscription);
    subscriptionRepository.save.mockResolvedValue(savedSubscription);

    const firstSubscription = await service.subscribeToSaleComments(userId, saleId);
    const secondSubscription = await service.subscribeToSaleComments(userId, saleId);

    expect(firstSubscription).toBe(savedSubscription);
    expect(secondSubscription).toBe(savedSubscription);
    expect(subscriptionRepository.save).toHaveBeenCalledTimes(1);
  });
});
