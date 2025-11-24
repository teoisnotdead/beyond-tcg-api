import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';

describe('CategoriesController', () => {
    let controller: CategoriesController;
    let service: any;

    beforeEach(async () => {
        service = {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [CategoriesController],
            providers: [
                { provide: CategoriesService, useValue: service },
            ],
        }).compile();

        controller = module.get<CategoriesController>(CategoriesController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('create', () => {
        it('should create a category', async () => {
            const dto = { name: 'Magic', slug: 'magic' };
            service.create.mockResolvedValue({ id: '1', ...dto });

            const result = await controller.create(dto as any);

            expect(service.create).toHaveBeenCalledWith(dto);
            expect(result.id).toBe('1');
        });
    });

    describe('findAll', () => {
        it('should return all categories', async () => {
            const categories = [{ id: '1', name: 'Magic' }];
            service.findAll.mockResolvedValue(categories);

            const result = await controller.findAll();

            expect(service.findAll).toHaveBeenCalled();
            expect(result).toEqual(categories);
        });
    });

    describe('findOne', () => {
        it('should return a category by id', async () => {
            const category = { id: '1', name: 'Magic' };
            service.findOne.mockResolvedValue(category);

            const result = await controller.findOne('1');

            expect(service.findOne).toHaveBeenCalledWith('1');
            expect(result).toEqual(category);
        });
    });

    describe('update', () => {
        it('should update a category', async () => {
            const dto = { name: 'Updated', slug: 'updated' };
            service.update.mockResolvedValue({ id: '1', ...dto });

            const result = await controller.update('1', dto as any);

            expect(service.update).toHaveBeenCalledWith('1', dto);
            expect(result.name).toBe('Updated');
        });
    });

    describe('remove', () => {
        it('should remove a category', async () => {
            service.remove.mockResolvedValue(undefined);

            await controller.remove('1');

            expect(service.remove).toHaveBeenCalledWith('1');
        });
    });
});
