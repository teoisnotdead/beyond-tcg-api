import { CloudinaryService } from './cloudinary.service';
import { v2 as cloudinary } from 'cloudinary';

jest.mock('cloudinary', () => ({
    v2: {
        uploader: {
            upload_stream: jest.fn(),
            destroy: jest.fn(),
        },
    },
}));

describe('CloudinaryService', () => {
    let service: CloudinaryService;

    beforeEach(() => {
        service = new CloudinaryService();
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('extractPublicId', () => {
        it('should extract public ID from Cloudinary URL', () => {
            const url = 'https://res.cloudinary.com/demo/image/upload/v1234567890/folder/image.jpg';
            const publicId = service.extractPublicId(url);
            expect(publicId).toBe('folder/image');
        });

        it('should handle URLs without version', () => {
            const url = 'https://res.cloudinary.com/demo/image/upload/folder/image.png';
            const publicId = service.extractPublicId(url);
            expect(publicId).toBe('folder/image');
        });

        it('should return null for invalid URLs', () => {
            const url = 'https://example.com/image.jpg';
            const publicId = service.extractPublicId(url);
            expect(publicId).toBeNull();
        });

        it('should return null for empty string', () => {
            const publicId = service.extractPublicId('');
            expect(publicId).toBeNull();
        });

        it('should return null for null input', () => {
            const publicId = service.extractPublicId(null as any);
            expect(publicId).toBeNull();
        });
    });

    describe('uploadImage', () => {
        it('should upload image successfully', async () => {
            const mockFile = {
                buffer: Buffer.from('test'),
            } as Express.Multer.File;

            const mockResult = { secure_url: 'https://cloudinary.com/image.jpg', public_id: 'test_id' };

            (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation((options, callback) => {
                callback(null, mockResult);
                return { end: jest.fn() };
            });

            const result = await service.uploadImage(mockFile, 'test-folder');

            expect(result).toEqual(mockResult);
            expect(cloudinary.uploader.upload_stream).toHaveBeenCalledWith(
                { folder: 'test-folder', resource_type: 'auto' },
                expect.any(Function)
            );
        });

        it('should reject on upload error', async () => {
            const mockFile = {
                buffer: Buffer.from('test'),
            } as Express.Multer.File;

            const mockError = new Error('Upload failed');

            (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation((options, callback) => {
                callback(mockError, null);
                return { end: jest.fn() };
            });

            await expect(service.uploadImage(mockFile, 'test-folder')).rejects.toThrow('Upload failed');
        });
    });

    describe('deleteImage', () => {
        it('should delete image successfully', async () => {
            const mockResult = { result: 'ok' };

            (cloudinary.uploader.destroy as jest.Mock).mockImplementation((publicId, callback) => {
                callback(null, mockResult);
            });

            const result = await service.deleteImage('test_public_id');

            expect(result).toEqual(mockResult);
            expect(cloudinary.uploader.destroy).toHaveBeenCalledWith('test_public_id', expect.any(Function));
        });

        it('should reject on delete error', async () => {
            const mockError = new Error('Delete failed');

            (cloudinary.uploader.destroy as jest.Mock).mockImplementation((publicId, callback) => {
                callback(mockError, null);
            });

            await expect(service.deleteImage('test_public_id')).rejects.toThrow('Delete failed');
        });
    });
});
