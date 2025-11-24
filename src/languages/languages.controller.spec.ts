import { Test, TestingModule } from '@nestjs/testing';
import { LanguagesController } from './languages.controller';
import { LanguagesService } from './languages.service';

describe('LanguagesController', () => {
    let controller: LanguagesController;
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
            controllers: [LanguagesController],
            providers: [
                { provide: LanguagesService, useValue: service },
            ],
        }).compile();

        controller = module.get<LanguagesController>(LanguagesController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('create', () => {
        it('should create a language', async () => {
            const dto = { name: 'English', slug: 'english' };
            service.create.mockResolvedValue({ id: '1', ...dto });

            const result = await controller.create(dto as any);

            expect(service.create).toHaveBeenCalledWith(dto);
            expect(result.id).toBe('1');
        });
    });

    describe('findAll', () => {
        it('should return all languages', async () => {
            const languages = [{ id: '1', name: 'English' }];
            service.findAll.mockResolvedValue(languages);

            const result = await controller.findAll();

            expect(service.findAll).toHaveBeenCalled();
            expect(result).toEqual(languages);
        });
    });

    describe('findOne', () => {
        it('should return a language by id', async () => {
            const language = { id: '1', name: 'English' };
            service.findOne.mockResolvedValue(language);

            const result = await controller.findOne('1');

            expect(service.findOne).toHaveBeenCalledWith('1');
            expect(result).toEqual(language);
        });
    });

    describe('update', () => {
        it('should update a language', async () => {
            const dto = { name: 'Updated', slug: 'updated' };
            service.update.mockResolvedValue({ id: '1', ...dto });

            const result = await controller.update('1', dto as any);

            expect(service.update).toHaveBeenCalledWith('1', dto);
            expect(result.name).toBe('Updated');
        });
    });

    describe('remove', () => {
        it('should remove a language', async () => {
            service.remove.mockResolvedValue(undefined);

            await controller.remove('1');

            expect(service.remove).toHaveBeenCalledWith('1');
        });
    });
});
