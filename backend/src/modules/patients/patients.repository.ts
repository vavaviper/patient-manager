import { Injectable } from '@nestjs/common';
import { PatientStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  buildPatientWhere,
  getPatientSort,
} from './patient-status.util';

@Injectable()
export class PatientsRepository {
  constructor(private prisma: PrismaService) {}

  findMany(params: {
    where?: Prisma.PatientWhereInput;
    orderBy?: Prisma.PatientOrderByWithRelationInput;
    skip?: number;
    take?: number;
  }) {
    return this.prisma.patient.findMany({
      ...params,
      include: {
        appointments: {
          take: 1,
          orderBy: { appointmentDate: 'desc' },
          include: { dentist: true },
        },
      },
    });
  }

  findById(id: string) {
    return this.prisma.patient.findUnique({
      where: { id },
      include: {
        appointments: {
          orderBy: { appointmentDate: 'desc' },
          include: { dentist: true, operatory: true },
        },
        medicalNotes: { orderBy: { createdAt: 'desc' } },
      },
    });
  }

  findByStatus(status: PatientStatus) {
    return this.prisma.patient.findMany({
      where: { status },
      orderBy: { updatedAt: 'desc' },
    });
  }

  count(where?: Prisma.PatientWhereInput) {
    return this.prisma.patient.count({ where });
  }

  create(data: Prisma.PatientCreateInput) {
    return this.prisma.patient.create({ data });
  }

  update(id: string, data: Prisma.PatientUpdateInput) {
    return this.prisma.patient.update({ where: { id }, data });
  }

  updateStatus(id: string, status: PatientStatus) {
    return this.prisma.patient.update({
      where: { id },
      data: { status },
    });
  }

  searchQuery(query: {
    search?: string;
    status?: PatientStatus;
    dentistId?: string;
    recallDue?: boolean;
    inactive?: boolean;
    sort?: string;
    page?: number;
    limit?: number;
  }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = buildPatientWhere(query);
    const orderBy = getPatientSort(query.sort);

    return {
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      page,
      limit,
    };
  }

  findAllForExport(where?: Prisma.PatientWhereInput) {
    return this.prisma.patient.findMany({
      where,
      orderBy: { lastName: 'asc' },
    });
  }
}
