import { Test, TestingModule } from '@nestjs/testing';
import { BadgesController } from './badges.controller';
import { BadgesService } from './badges.service';

describe('BadgesController', () => {
    let controller: BadgesController;
    let service: any;

    beforeEach(async () => {
        service = {
            findAllBadges: jest.fn(),
            findUserBadges: jest.fn(),
            findStoreBadges: jest.fn(),
            createBadge: jest.fn(),
            updateBadge: jest.fn(),
            assignBadgeToUser: jest.fn(),
            assignBadgeToStore: jest.fn(),
            removeBadgeFromUser: jest.fn(),
            removeBadgeFromStore: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [BadgesController],
            providers: [
                { provide: BadgesService, useValue: service },
            ],
        }).compile();

        controller = module.get<BadgesController>(BadgesController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('findAll', () => {
        it('should return all active badges', async () => {
            const badges = [{ id: 'badge-1', name: 'Verified' }];
            service.findAllBadges.mockResolvedValue(badges);

            const result = await controller.findAll();

            expect(service.findAllBadges).toHaveBeenCalled();
            expect(result).toEqual(badges);
        });
    });

    describe('findUserBadges', () => {
        it('should return badges for a user', async () => {
            const badges = [{ id: 'badge-1', name: 'Top Seller' }];
            service.findUserBadges.mockResolvedValue(badges);

            const result = await controller.findUserBadges('user-1');

            expect(service.findUserBadges).toHaveBeenCalledWith('user-1');
            expect(result).toEqual(badges);
        });
    });

    describe('findStoreBadges', () => {
        it('should return badges for a store', async () => {
            const badges = [{ id: 'badge-1', name: 'Featured' }];
            service.findStoreBadges.mockResolvedValue(badges);

            const result = await controller.findStoreBadges('store-1');

            expect(service.findStoreBadges).toHaveBeenCalledWith('store-1');
            expect(result).toEqual(badges);
        });
    });

    describe('createBadge', () => {
        it('should create a badge', async () => {
            const dto = { name: 'New Badge', description: 'Test' };
            const badge = { id: 'badge-1', ...dto };
            service.createBadge.mockResolvedValue(badge);

            const result = await controller.createBadge(dto as any);

            expect(service.createBadge).toHaveBeenCalledWith(dto);
            expect(result).toEqual(badge);
        });
    });

    describe('updateBadge', () => {
        it('should update a badge', async () => {
            const dto = { name: 'Updated Badge' };
            const badge = { id: 'badge-1', ...dto };
            service.updateBadge.mockResolvedValue(badge);

            const result = await controller.updateBadge('badge-1', dto as any);

            expect(service.updateBadge).toHaveBeenCalledWith('badge-1', dto);
            expect(result).toEqual(badge);
        });
    });

    describe('assignBadgeToUser', () => {
        it('should assign badge to user', async () => {
            const assignment = { user_id: 'user-1', badge_id: 'badge-1' };
            service.assignBadgeToUser.mockResolvedValue(assignment);

            const result = await controller.assignBadgeToUser('user-1', 'badge-1', {});

            expect(service.assignBadgeToUser).toHaveBeenCalledWith('user-1', 'badge-1', {});
            expect(result).toEqual(assignment);
        });
    });

    describe('assignBadgeToStore', () => {
        it('should assign badge to store', async () => {
            const assignment = { store_id: 'store-1', badge_id: 'badge-1' };
            service.assignBadgeToStore.mockResolvedValue(assignment);

            const result = await controller.assignBadgeToStore('store-1', 'badge-1', {});

            expect(service.assignBadgeToStore).toHaveBeenCalledWith('store-1', 'badge-1', {});
            expect(result).toEqual(assignment);
        });
    });

    describe('removeBadgeFromUser', () => {
        it('should remove badge from user', async () => {
            service.removeBadgeFromUser.mockResolvedValue(undefined);

            await controller.removeBadgeFromUser('user-1', 'badge-1');

            expect(service.removeBadgeFromUser).toHaveBeenCalledWith('user-1', 'badge-1');
        });
    });

    describe('removeBadgeFromStore', () => {
        it('should remove badge from store', async () => {
            service.removeBadgeFromStore.mockResolvedValue(undefined);

            await controller.removeBadgeFromStore('store-1', 'badge-1');

            expect(service.removeBadgeFromStore).toHaveBeenCalledWith('store-1', 'badge-1');
        });
    });
});
