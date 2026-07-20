import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateSettingsDto } from './dto/settings.dto';

const DEFAULT_BUSINESS_HOURS = {
  monday: { open: '08:00', close: '18:00', closed: false },
  tuesday: { open: '08:00', close: '18:00', closed: false },
  wednesday: { open: '08:00', close: '18:00', closed: false },
  thursday: { open: '08:00', close: '18:00', closed: false },
  friday: { open: '08:00', close: '17:00', closed: false },
  saturday: { open: '09:00', close: '13:00', closed: false },
  sunday: { open: '09:00', close: '13:00', closed: true },
};

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async getSettings() {
    let settings = await this.prisma.clinicSettings.findUnique({
      where: { id: 'default' },
    });
    if (!settings) {
      settings = await this.prisma.clinicSettings.create({
        data: {
          id: 'default',
          businessHours: DEFAULT_BUSINESS_HOURS,
        },
      });
    }
    const operatories = await this.prisma.operatory.findMany({
      orderBy: { name: 'asc' },
    });
    const dentists = await this.prisma.dentist.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    });
    return { ...settings, operatories, dentists };
  }

  updateSettings(dto: UpdateSettingsDto) {
    const data = dto as Prisma.ClinicSettingsUpdateInput;
    return this.prisma.clinicSettings.upsert({
      where: { id: 'default' },
      create: { id: 'default', ...data } as Prisma.ClinicSettingsCreateInput,
      update: data,
    });
  }

  getOperatories() {
    return this.prisma.operatory.findMany({ orderBy: { name: 'asc' } });
  }

  createOperatory(data: { name: string; chair: string }) {
    return this.prisma.operatory.create({ data });
  }

  updateOperatory(id: string, data: { name?: string; chair?: string; active?: boolean }) {
    return this.prisma.operatory.update({ where: { id }, data });
  }
}
