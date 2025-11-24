import { Test, TestingModule } from '@nestjs/testing';
import { BadgesService } from './badges.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Badge } from './entities/badge.entity';
import { UserBadge } from './entities/user-badge.entity';
import { StoreBadge } from './entities/store-badge.entity';

describe('BadgesService', () => {
    let service: BadgesService;
    let badgeRepository: any;
    let userBadgeRepository: any;
    let storeBadgeRepository: any;

    beforeEach(async () => {
        badgeRepository = {
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            findOneBy: jest.fn(),
        };

        userBadgeRepository = {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
        };

        storeBadgeRepository = {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                BadgesService,
                { provide: getRepositoryToken(Badge), useValue: badgeRepository },
                { provide: getRepositoryToken(UserBadge), useValue: userBadgeRepository },
                { provide: getRepositoryToken(StoreBadge), useValue: storeBadgeRepository },
            ],
        }).compile();

        service = module.get<BadgesService>(BadgesService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('findAllBadges', () => {
        it('should return all active badges', async () => {
            const badges = [{ id: 'badge-1', name: 'Verified', isActive: true }];
            badgeRepository.find.mockResolvedValue(badges);

            const result = await service.findAllBadges();

            expect(badgeRepository.find).toHaveBeenCalledWith({ where: { isActive: true } });
            expect(result).toEqual(badges);
        });
    });

    describe('findUserBadges', () => {
        it('should return badges for a user', async () => {
            const userBadges = [{ id: 'ub-1', badge: { name: 'Top Seller' } }];
            userBadgeRepository.find.mockResolvedValue(userBadges);

            const result = await service.findUserBadges('user-1');

            expect(userBadgeRepository.find).toHaveBeenCalledWith({
                where: { user: { id: 'user-1' } },
                relations: ['badge'],
            });
            expect(result).toEqual(userBadges);
        });
    });

    describe('findStoreBadges', () => {
        it('should return badges for a store', async () => {
            const storeBadges = [{ id: 'sb-1', badge: { name: 'Featured' } }];
            storeBadgeRepository.find.mockResolvedValue(storeBadges);

            const result = await service.findStoreBadges('store-1');

            expect(storeBadgeRepository.find).toHaveBeenCalledWith({
                where: { store: { id: 'store-1' } },
                relations: ['badge'],
            });
            expect(result).toEqual(storeBadges);
        });
    });

    describe('assignBadgeToUser', () => {
        it('should assign badge to user', async () => {
            const userBadge = { id: 'ub-1', user: { id: 'user-1' }, badge: { id: 'badge-1' } };

            userBadgeRepository.findOne.mockResolvedValue(null);
            userBadgeRepository.create.mockReturnValue(userBadge);
            userBadgeRepository.save.mockResolvedValue(userBadge);

            const result = await service.assignBadgeToUser('user-1', 'badge-1', { reason: 'test' });

            expect(userBadgeRepository.findOne).toHaveBeenCalled();
            expect(userBadgeRepository.create).toHaveBeenCalledWith({
                user: { id: 'user-1' },
                badge: { id: 'badge-1' },
                metadata: { reason: 'test' },
            });
            expect(userBadgeRepository.save).toHaveBeenCalledWith(userBadge);
            expect(result).toEqual(userBadge);
        });

        it('should return existing badge if already assigned', async () => {
            const existingBadge = { id: 'ub-1', user: { id: 'user-1' }, badge: { id: 'badge-1' } };
            userBadgeRepository.findOne.mockResolvedValue(existingBadge);

            const result = await service.assignBadgeToUser('user-1', 'badge-1');

            expect(userBadgeRepository.save).not.toHaveBeenCalled();
            expect(result).toEqual(existingBadge);
        });
    });

    describe('assignBadgeToStore', () => {
        it('should assign badge to store', async () => {
            const storeBadge = { id: 'sb-1', store: { id: 'store-1' }, badge: { id: 'badge-1' } };

            storeBadgeRepository.findOne.mockResolvedValue(null);
            storeBadgeRepository.create.mockReturnValue(storeBadge);
            storeBadgeRepository.save.mockResolvedValue(storeBadge);

            const result = await service.assignBadgeToStore('store-1', 'badge-1', { reason: 'featured' });

            expect(storeBadgeRepository.findOne).toHaveBeenCalled();
            expect(storeBadgeRepository.create).toHaveBeenCalledWith({
                store: { id: 'store-1' },
                badge: { id: 'badge-1' },
                metadata: { reason: 'featured' },
            });
            expect(storeBadgeRepository.save).toHaveBeenCalledWith(storeBadge);
            expect(result).toEqual(storeBadge);
        });

        it('should return existing badge if already assigned', async () => {
            const existingBadge = { id: 'sb-1', store: { id: 'store-1' }, badge: { id: 'badge-1' } };
            storeBadgeRepository.findOne.mockResolvedValue(existingBadge);

            const result = await service.assignBadgeToStore('store-1', 'badge-1');

            expect(storeBadgeRepository.save).not.toHaveBeenCalled();
            expect(result).toEqual(existingBadge);
        });
    });

    describe('removeBadgeFromUser', () => {
        it('should remove badge from user', async () => {
            userBadgeRepository.delete.mockResolvedValue({ affected: 1 });

            await service.removeBadgeFromUser('user-1', 'badge-1');

            expect(userBadgeRepository.delete).toHaveBeenCalledWith({
                user: { id: 'user-1' },
                badge: { id: 'badge-1' },
            });
        });
    });

    describe('removeBadgeFromStore', () => {
        it('should remove badge from store', async () => {
            storeBadgeRepository.delete.mockResolvedValue({ affected: 1 });

            await service.removeBadgeFromStore('store-1', 'badge-1');

            expect(storeBadgeRepository.delete).toHaveBeenCalledWith({
                store: { id: 'store-1' },
                badge: { id: 'badge-1' },
            });
        });
    });

    describe('createBadge', () => {
        it('should create a new badge', async () => {
            const dto = { name: 'New Badge', description: 'Test badge' };
            const badge = { id: 'badge-1', ...dto };

            badgeRepository.create.mockReturnValue(badge);
            badgeRepository.save.mockResolvedValue(badge);

            const result = await service.createBadge(dto as any);

            expect(badgeRepository.create).toHaveBeenCalledWith(dto);
            expect(badgeRepository.save).toHaveBeenCalledWith(badge);
            expect(result).toEqual(badge);
        });
    });

    describe('updateBadge', () => {
        it('should update a badge', async () => {
            const dto = { name: 'Updated Badge' };
            const updatedBadge = { id: 'badge-1', ...dto };

            badgeRepository.update.mockResolvedValue({ affected: 1 });
            badgeRepository.findOneBy.mockResolvedValue(updatedBadge);

            const result = await service.updateBadge('badge-1', dto as any);

            expect(badgeRepository.update).toHaveBeenCalledWith('badge-1', dto);
            expect(badgeRepository.findOneBy).toHaveBeenCalledWith({ id: 'badge-1' });
            expect(result).toEqual(updatedBadge);
        });
    });
});
