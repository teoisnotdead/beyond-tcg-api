import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { LanguagesService } from './languages.service';
import { Language } from './entities/language.entity';
import { NotFoundException } from '@nestjs/common';

describe('LanguagesService', () => {
    let service: LanguagesService;
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
                LanguagesService,
                { provide: getRepositoryToken(Language), useValue: repository },
            ],
        }).compile();

        service = module.get<LanguagesService>(LanguagesService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        it('should create a new language', async () => {
            const createDto = { name: 'English', slug: 'english' };
            const language = { id: '1', ...createDto };

            repository.create.mockReturnValue(language);
            repository.save.mockResolvedValue(language);

            const result = await service.create(createDto);

            expect(repository.create).toHaveBeenCalledWith(createDto);
            expect(repository.save).toHaveBeenCalledWith(language);
            expect(result).toEqual(language);
        });
    });

    describe('findAll', () => {
        it('should return an array of languages', async () => {
            const languages = [
                { id: '1', name: 'English', slug: 'english' },
                { id: '2', name: 'Spanish', slug: 'spanish' },
            ];

            repository.find.mockResolvedValue(languages);

            const result = await service.findAll();

            expect(repository.find).toHaveBeenCalled();
            expect(result).toEqual(languages);
        });
    });

    describe('findOne', () => {
        it('should return a language by id', async () => {
            const language = { id: '1', name: 'English', slug: 'english' };

            repository.findOne.mockResolvedValue(language);

            const result = await service.findOne('1');

            expect(repository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
            expect(result).toEqual(language);
        });

        it('should throw NotFoundException when language not found', async () => {
            repository.findOne.mockResolvedValue(null);

            await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
        });
    });

    describe('update', () => {
        it('should update a language', async () => {
            const existingLanguage = { id: '1', name: 'English', slug: 'english' };
            const updateDto = { name: 'English (US)', slug: 'english-us' };
            const updatedLanguage = { id: '1', ...updateDto };

            repository.findOne.mockResolvedValue(existingLanguage);
            repository.save.mockResolvedValue(updatedLanguage);

            const result = await service.update('1', updateDto);

            expect(repository.save).toHaveBeenCalled();
            expect(result).toEqual(updatedLanguage);
        });

        it('should throw NotFoundException when updating non-existent language', async () => {
            repository.findOne.mockResolvedValue(null);

            await expect(service.update('999', { name: 'Test', slug: 'test' })).rejects.toThrow(NotFoundException);
        });
    });

    describe('remove', () => {
        it('should delete a language', async () => {
            repository.delete.mockResolvedValue({ affected: 1 });

            const result = await service.remove('1');

            expect(repository.delete).toHaveBeenCalledWith('1');
            expect(result).toEqual({ message: 'Language deleted successfully' });
        });

        it('should throw NotFoundException when deleting non-existent language', async () => {
            repository.delete.mockResolvedValue({ affected: 0 });

            await expect(service.remove('999')).rejects.toThrow(NotFoundException);
        });
    });
});
