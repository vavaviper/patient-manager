import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ActivityAction } from '@prisma/client';

@Injectable()
export class ActivityRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    userId?: string;
    patientId?: string;
    action: ActivityAction;
    details?: string;
  }) {
    return this.prisma.activityLog.create({ data });
  }

  async findMany(options?: { limit?: number; patientId?: string }) {
    return this.prisma.activityLog.findMany({
      where: options?.patientId ? { patientId: options.patientId } : undefined,
      orderBy: { timestamp: 'desc' },
      take: options?.limit ?? 50,
      include: {
        user: { select: { id: true, name: true, role: true } },
        patient: { select: { id: true, pid: true, firstName: true, lastName: true } },
      },
    });
  }
}
