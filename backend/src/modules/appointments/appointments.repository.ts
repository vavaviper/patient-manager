import { Injectable } from '@nestjs/common';
import { Prisma, AppointmentStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AppointmentsRepository {
  constructor(private prisma: PrismaService) {}

  findMany(params: {
    where?: Prisma.AppointmentWhereInput;
    skip?: number;
    take?: number;
  }) {
    return this.prisma.appointment.findMany({
      ...params,
      orderBy: { appointmentDate: 'asc' },
      include: {
        patient: {
          select: {
            id: true,
            pid: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
          },
        },
        dentist: true,
        operatory: true,
      },
    });
  }

  findById(id: string) {
    return this.prisma.appointment.findUnique({
      where: { id },
      include: { patient: true, dentist: true, operatory: true },
    });
  }

  create(data: Prisma.AppointmentCreateInput) {
    return this.prisma.appointment.create({
      data,
      include: { patient: true, dentist: true, operatory: true },
    });
  }

  update(id: string, data: Prisma.AppointmentUpdateInput) {
    return this.prisma.appointment.update({
      where: { id },
      data,
      include: { patient: true, dentist: true, operatory: true },
    });
  }

  findOverlapping(params: {
    dentistId: string;
    operatoryId?: string;
    start: Date;
    end: Date;
    excludeId?: string;
  }) {
    const { dentistId, operatoryId, start, end, excludeId } = params;

    const baseWhere: Prisma.AppointmentWhereInput = {
      status: { notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW] },
      appointmentDate: { lt: end },
      id: excludeId ? { not: excludeId } : undefined,
    };

    return this.prisma.appointment.findMany({
      where: {
        OR: [
          {
            ...baseWhere,
            dentistId,
          },
          operatoryId
            ? {
                ...baseWhere,
                operatoryId,
              }
            : undefined,
        ].filter(Boolean) as Prisma.AppointmentWhereInput[],
      },
    }).then((appointments) =>
      appointments.filter((apt) => {
        const aptEnd = new Date(apt.appointmentDate);
        aptEnd.setMinutes(aptEnd.getMinutes() + apt.duration);
        return apt.appointmentDate < end && aptEnd > start;
      }),
    );
  }

  findForDateRange(start: Date, end: Date, dentistId?: string) {
    return this.findMany({
      where: {
        appointmentDate: { gte: start, lte: end },
        dentistId,
        status: { notIn: [AppointmentStatus.CANCELLED] },
      },
    });
  }

  count(where?: Prisma.AppointmentWhereInput) {
    return this.prisma.appointment.count({ where });
  }
}
