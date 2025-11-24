import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CommentsService } from 'src/comments/comments.service';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: jest.Mocked<UsersService>;
  let commentsService: jest.Mocked<CommentsService>;

  beforeEach(async () => {
    usersService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      searchUsers: jest.fn(),
      getCurrentTier: jest.fn(),
    } as unknown as jest.Mocked<UsersService>;

    commentsService = {
      findAllForUser: jest.fn(),
      findAllByAuthor: jest.fn(),
      findAllForSale: jest.fn(),
      create: jest.fn(),
    } as unknown as jest.Mocked<CommentsService>;

    controller = new UsersController(usersService, commentsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
