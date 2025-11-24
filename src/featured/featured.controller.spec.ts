import { Test, TestingModule } from '@nestjs/testing';
import { FeaturedController } from './featured.controller';
import { FeaturedService } from './featured.service';

describe('FeaturedController', () => {
    let controller: FeaturedController;
    let service: any;

    beforeEach(async () => {
        service = {
            getFeatured: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [FeaturedController],
            providers: [
                { provide: FeaturedService, useValue: service },
            ],
        }).compile();

        controller = module.get<FeaturedController>(FeaturedController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('getFeatured', () => {
        it('should return featured stores and users', async () => {
            const featured = {
                stores: [{ id: 'store-1', name: 'Featured Store' }],
                users: [{ id: 'user-1', name: 'Featured User' }],
            };

            service.getFeatured.mockResolvedValue(featured);

            const result = await controller.getFeatured();

            expect(service.getFeatured).toHaveBeenCalled();
            expect(result).toEqual(featured);
        });
    });
});
