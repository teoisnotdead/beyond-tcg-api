import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Language } from './entities/language.entity';
import { CreateLanguageDto } from './dto/create-language.dto';

@Injectable()
export class LanguagesService {
  constructor(
    @InjectRepository(Language)
    private languagesRepository: Repository<Language>,
  ) {}

  async create(createLanguageDto: CreateLanguageDto): Promise<Language> {
    const language = this.languagesRepository.create(createLanguageDto);
    return await this.languagesRepository.save(language);
  }

  async findAll(): Promise<Language[]> {
    return await this.languagesRepository.find();
  }

  async findOne(id: string): Promise<Language> {
    const language = await this.languagesRepository.findOne({ where: { id } });
    if (!language) {
      throw new NotFoundException(`Language with ID ${id} not found`);
    }
    return language;
  }

  async update(id: string, updateLanguageDto: CreateLanguageDto): Promise<Language> {
    const language = await this.findOne(id);
    Object.assign(language, updateLanguageDto);
    return await this.languagesRepository.save(language);
  }

  async remove(id: string): Promise<{ message: string }> {
    const result = await this.languagesRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Language with ID ${id} not found`);
    }
    return { message: 'Language deleted successfully' };
  }
} 