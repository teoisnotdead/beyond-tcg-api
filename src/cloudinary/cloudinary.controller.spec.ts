import { Test, TestingModule } from '@nestjs/testing';
import { CloudinaryController } from './cloudinary.controller';
import { CloudinaryService } from './cloudinary.service';
import { UsersService } from '../users/users.service';

describe('CloudinaryController', () => {
    let controller: CloudinaryController;
    let cloudinaryService: any;
    let usersService: any;

    beforeEach(async () => {
        cloudinaryService = {
            uploadImage: jest.fn(),
            deleteImage: jest.fn(),
            updateImage: jest.fn(),
        };

        usersService = {
            findOne: jest.fn(),
            update: jest.fn(),
            findByEmail: jest.fn(),
            create: jest.fn(),
            getCurrentTier: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [CloudinaryController],
            providers: [
                { provide: CloudinaryService, useValue: cloudinaryService },
                { provide: UsersService, useValue: usersService },
            ],
        }).compile();

        controller = module.get<CloudinaryController>(CloudinaryController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('uploadImage', () => {
        it('should upload an image', async () => {
            const file = { mimetype: 'image/png' } as Express.Multer.File;
            const uploadResult = { secure_url: 'https://cloudinary.com/image.png' };

            cloudinaryService.uploadImage.mockResolvedValue(uploadResult);

            const result = await controller.uploadImage(file, 'test-folder');

            expect(cloudinaryService.uploadImage).toHaveBeenCalledWith(file, 'test-folder');
            expect(result.message).toBe('Image uploaded successfully');
            expect(result.data).toEqual(uploadResult);
        });

        it('should return error if file is missing', async () => {
            const result = await controller.uploadImage(null as any, 'folder');
            expect(result.message).toBe('File is required');
        });

        it('should return error if file is not an image', async () => {
            const file = { mimetype: 'application/pdf' } as Express.Multer.File;
            const result = await controller.uploadImage(file, 'folder');
            expect(result.message).toBe('Only image files are allowed');
        });
    });

    describe('deleteImage', () => {
        it('should delete an image', async () => {
            const deleteResult = { result: 'ok' };
            cloudinaryService.deleteImage.mockResolvedValue(deleteResult);

            const result = await controller.deleteImage('public-id-123');

            expect(cloudinaryService.deleteImage).toHaveBeenCalledWith('public-id-123');
            expect(result.message).toBe('Image deleted successfully');
        });

        it('should return error if publicId is missing', async () => {
            const result = await controller.deleteImage('');
            expect(result.message).toBe('publicId is required');
        });
    });

    describe('uploadAvatar', () => {
        it('should upload and update user avatar', async () => {
            const file = { mimetype: 'image/jpeg' } as Express.Multer.File;
            const req = { user: { id: 'user-1' } };
            const user = { id: 'user-1', avatar_url: 'old-avatar.jpg' };
            const uploadResult = { secure_url: 'https://cloudinary.com/new-avatar.jpg' };

            usersService.findOne.mockResolvedValue(user);
            cloudinaryService.updateImage.mockResolvedValue(uploadResult);
            usersService.update.mockResolvedValue(undefined);

            const result = await controller.uploadAvatar(file, req);

            expect(usersService.findOne).toHaveBeenCalledWith('user-1');
            expect(cloudinaryService.updateImage).toHaveBeenCalledWith(file, 'old-avatar.jpg', 'Beyond TCG/avatars');
            expect(usersService.update).toHaveBeenCalledWith('user-1', { avatar_url: uploadResult.secure_url });
            expect(result.message).toBe('Avatar updated successfully');
            expect(result.avatar_url).toBe(uploadResult.secure_url);
        });

        it('should return error if file is missing', async () => {
            const result = await controller.uploadAvatar(null as any, { user: { id: '1' } });
            expect(result.message).toBe('File is required');
        });
    });
});
