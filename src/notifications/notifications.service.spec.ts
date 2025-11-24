import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { Notification, NotificationType } from './entities/notification.entity';
import { NotificationsGateway } from './notifications.gateway';

describe('NotificationsService', () => {
    let service: NotificationsService;
    let repository: any;
    let gateway: any;

    beforeEach(async () => {
        repository = {
            create: jest.fn(),
            save: jest.fn(),
            findAndCount: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
        };

        gateway = {
            server: {
                to: jest.fn().mockReturnThis(),
                emit: jest.fn(),
            },
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                NotificationsService,
                { provide: getRepositoryToken(Notification), useValue: repository },
                { provide: NotificationsGateway, useValue: gateway },
            ],
        }).compile();

        service = module.get<NotificationsService>(NotificationsService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        it('should create notification and emit event', async () => {
            const data = {
                user_id: 'user-1',
                type: NotificationType.SALE_CREATED,
                metadata: { saleId: 'sale-1' },
            };
            const notification = { id: 'notif-1', ...data };

            repository.create.mockReturnValue(notification);
            repository.save.mockResolvedValue(notification);

            const result = await service.create(data);

            expect(repository.create).toHaveBeenCalledWith(data);
            expect(repository.save).toHaveBeenCalledWith(notification);
            expect(gateway.server.to).toHaveBeenCalledWith(data.user_id);
            expect(gateway.server.emit).toHaveBeenCalledWith('notification', notification);
            expect(result).toEqual(notification);
        });
    });

    describe('getUserNotifications', () => {
        it('should return paginated notifications', async () => {
            const userId = 'user-1';
            const notifications = [{ id: '1' }, { id: '2' }];
            const total = 2;

            repository.findAndCount.mockResolvedValue([notifications, total]);

            const result = await service.getUserNotifications(userId, 1, 10);

            expect(repository.findAndCount).toHaveBeenCalledWith({
                where: { user_id: userId },
                order: { created_at: 'DESC' },
                skip: 0,
                take: 10,
            });
            expect(result).toEqual({
                notifications,
                total,
                page: 1,
                totalPages: 1,
            });
        });
    });

    describe('markAsRead', () => {
        it('should mark notification as read', async () => {
            const notification = { id: '1', user_id: 'user-1', is_read: false };
            const updatedNotification = { ...notification, is_read: true };

            repository.findOne.mockResolvedValue(notification);
            repository.save.mockResolvedValue(updatedNotification);

            const result = await service.markAsRead('1', 'user-1');

            expect(repository.findOne).toHaveBeenCalledWith({
                where: { id: '1', user_id: 'user-1' },
            });
            expect(repository.save).toHaveBeenCalledWith(updatedNotification);
            expect(result).toEqual(updatedNotification);
        });

        it('should throw error if notification not found', async () => {
            repository.findOne.mockResolvedValue(null);

            await expect(service.markAsRead('1', 'user-1')).rejects.toThrow('Notification not found');
        });
    });

    describe('markAllAsRead', () => {
        it('should mark all notifications as read', async () => {
            const userId = 'user-1';

            await service.markAllAsRead(userId);

            expect(repository.update).toHaveBeenCalledWith(
                { user_id: userId, is_read: false },
                { is_read: true }
            );
        });
    });

    describe('deleteNotification', () => {
        it('should delete notification', async () => {
            const notificationId = '1';
            const userId = 'user-1';

            await service.deleteNotification(notificationId, userId);

            expect(repository.delete).toHaveBeenCalledWith({
                id: notificationId,
                user_id: userId,
            });
        });
    });

    describe('getUnreadCount', () => {
        it('should return unread count', async () => {
            const userId = 'user-1';
            const count = 5;

            repository.count.mockResolvedValue(count);

            const result = await service.getUnreadCount(userId);

            expect(repository.count).toHaveBeenCalledWith({
                where: { user_id: userId, is_read: false },
            });
            expect(result).toBe(count);
        });
    });
});
