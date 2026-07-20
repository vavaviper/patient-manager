import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDentistDto, UpdateDentistDto } from './dto/dentist.dto';

@Injectable()
export class DentistsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.dentist.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    });
  }

  findOne(id: string) {
    return this.prisma.dentist.findUnique({ where: { id } });
  }

  create(dto: CreateDentistDto) {
    return this.prisma.dentist.create({ data: dto });
  }

  update(id: string, dto: UpdateDentistDto) {
    return this.prisma.dentist.update({ where: { id }, data: dto });
  }
}
