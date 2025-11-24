import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CategoriesService } from './categories.service';
import { Category } from './entities/category.entity';
import { NotFoundException } from '@nestjs/common';

describe('CategoriesService', () => {
    let service: CategoriesService;
    let repository: any;

    beforeEach(async () => {
        repository = {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            delete: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CategoriesService,
                { provide: getRepositoryToken(Category), useValue: repository },
            ],
        }).compile();

        service = module.get<CategoriesService>(CategoriesService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        it('should create a new category', async () => {
            const createDto = { name: 'Pokemon', slug: 'pokemon' };
            const category = { id: '1', ...createDto };

            repository.create.mockReturnValue(category);
            repository.save.mockResolvedValue(category);

            const result = await service.create(createDto);

            expect(repository.create).toHaveBeenCalledWith(createDto);
            expect(repository.save).toHaveBeenCalledWith(category);
            expect(result).toEqual(category);
        });
    });

    describe('findAll', () => {
        it('should return an array of categories', async () => {
            const categories = [
                { id: '1', name: 'Pokemon', slug: 'pokemon' },
                { id: '2', name: 'Magic', slug: 'magic' },
            ];

            repository.find.mockResolvedValue(categories);

            const result = await service.findAll();

            expect(repository.find).toHaveBeenCalled();
            expect(result).toEqual(categories);
        });

        it('should return empty array when no categories exist', async () => {
            repository.find.mockResolvedValue([]);

            const result = await service.findAll();

            expect(result).toEqual([]);
        });
    });

    describe('findOne', () => {
        it('should return a category by id', async () => {
            const category = { id: '1', name: 'Pokemon', slug: 'pokemon' };

            repository.findOne.mockResolvedValue(category);

            const result = await service.findOne('1');

            expect(repository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
            expect(result).toEqual(category);
        });

        it('should throw NotFoundException when category not found', async () => {
            repository.findOne.mockResolvedValue(null);

            await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
            await expect(service.findOne('999')).rejects.toThrow('Category with ID 999 not found');
        });
    });

    describe('update', () => {
        it('should update a category', async () => {
            const existingCategory = { id: '1', name: 'Pokemon', slug: 'pokemon' };
            const updateDto = { name: 'Pokemon TCG', slug: 'pokemon-tcg' };
            const updatedCategory = { id: '1', name: 'Pokemon TCG', slug: 'pokemon-tcg' };

            repository.findOne.mockResolvedValue(existingCategory);
            repository.save.mockResolvedValue(updatedCategory);

            const result = await service.update('1', updateDto);

            expect(repository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
            expect(repository.save).toHaveBeenCalled();
            expect(result).toEqual(updatedCategory);
        });

        it('should throw NotFoundException when updating non-existent category', async () => {
            repository.findOne.mockResolvedValue(null);

            await expect(service.update('999', { name: 'Test', slug: 'test' })).rejects.toThrow(NotFoundException);
        });
    });

    describe('remove', () => {
        it('should delete a category', async () => {
            repository.delete.mockResolvedValue({ affected: 1 });

            const result = await service.remove('1');

            expect(repository.delete).toHaveBeenCalledWith('1');
            expect(result).toEqual({ message: 'Category deleted successfully' });
        });

        it('should throw NotFoundException when deleting non-existent category', async () => {
            repository.delete.mockResolvedValue({ affected: 0 });

            await expect(service.remove('999')).rejects.toThrow(NotFoundException);
            await expect(service.remove('999')).rejects.toThrow('Category with ID 999 not found');
        });
    });
});
