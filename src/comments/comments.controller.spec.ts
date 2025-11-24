import { Test, TestingModule } from '@nestjs/testing';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';

describe('CommentsController', () => {
    let controller: CommentsController;
    let service: any;

    beforeEach(async () => {
        service = {
            create: jest.fn(),
            findAllForSale: jest.fn(),
            findAllForStore: jest.fn(),
            findAllForUser: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [CommentsController],
            providers: [
                { provide: CommentsService, useValue: service },
            ],
        }).compile();

        controller = module.get<CommentsController>(CommentsController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('create', () => {
        it('should create a comment', async () => {
            const req = { user: { id: 'user-1' } };
            const dto = { content: 'Great product!', sale_id: 'sale-1' };
            const comment = { id: 'comment-1', ...dto, user_id: 'user-1' };

            service.create.mockResolvedValue(comment);

            const result = await controller.create(req as any, dto as any);

            expect(service.create).toHaveBeenCalledWith('user-1', dto);
            expect(result).toEqual(comment);
        });
    });

    describe('findAllForSale', () => {
        it('should return all comments for a sale', async () => {
            const comments = [{ id: '1', content: 'Comment 1' }];
            service.findAllForSale.mockResolvedValue(comments);

            const result = await controller.findAllForSale('sale-1');

            expect(service.findAllForSale).toHaveBeenCalledWith('sale-1');
            expect(result).toEqual(comments);
        });
    });

    describe('findAllForStore', () => {
        it('should return all comments for a store', async () => {
            const comments = [{ id: '1', content: 'Store comment' }];
            service.findAllForStore.mockResolvedValue(comments);

            const result = await controller.findAllForStore('store-1');

            expect(service.findAllForStore).toHaveBeenCalledWith('store-1');
            expect(result).toEqual(comments);
        });
    });

    describe('findAllForUser', () => {
        it('should return all comments for a user', async () => {
            const comments = [{ id: '1', content: 'User comment' }];
            service.findAllForUser.mockResolvedValue(comments);

            const result = await controller.findAllForUser('user-1');

            expect(service.findAllForUser).toHaveBeenCalledWith('user-1');
            expect(result).toEqual(comments);
        });
    });
});
