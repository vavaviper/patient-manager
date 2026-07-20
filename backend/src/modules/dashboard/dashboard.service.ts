import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subMonths,
  format,
} from 'date-fns';
import { PatientStatus, AppointmentStatus } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats(dentistId?: string) {
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const weekStart = startOfWeek(now);
    const weekEnd = endOfWeek(now);
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const appointmentWhere = dentistId ? { dentistId } : {};

    const [
      todayAppointments,
      recallDue,
      inactivePatients,
      weekAppointments,
      newPatients,
      totalPatients,
    ] = await Promise.all([
      this.prisma.appointment.count({
        where: {
          ...appointmentWhere,
          appointmentDate: { gte: todayStart, lte: todayEnd },
          status: { notIn: [AppointmentStatus.CANCELLED] },
        },
      }),
      this.prisma.patient.count({
        where: { status: PatientStatus.RECALL_DUE },
      }),
      this.prisma.patient.count({
        where: { status: PatientStatus.INACTIVE },
      }),
      this.prisma.appointment.count({
        where: {
          ...appointmentWhere,
          appointmentDate: { gte: weekStart, lte: weekEnd },
          status: { notIn: [AppointmentStatus.CANCELLED] },
        },
      }),
      this.prisma.patient.count({
        where: { createdAt: { gte: monthStart, lte: monthEnd } },
      }),
      this.prisma.patient.count(),
    ]);

    return {
      todayAppointments,
      recallDue,
      inactivePatients,
      weekAppointments,
      newPatients,
      totalPatients,
      revenuePlaceholder: 48500,
    };
  }

  async getCharts() {
    const months = Array.from({ length: 12 }, (_, i) => {
      const date = subMonths(new Date(), 11 - i);
      return {
        month: format(date, 'MMM yyyy'),
        start: startOfMonth(date),
        end: endOfMonth(date),
      };
    });

    const appointmentsPerMonth = await Promise.all(
      months.map(async ({ month, start, end }) => ({
        month,
        count: await this.prisma.appointment.count({
          where: {
            appointmentDate: { gte: start, lte: end },
            status: { notIn: [AppointmentStatus.CANCELLED] },
          },
        }),
      })),
    );

    const patientGrowth = await Promise.all(
      months.map(async ({ month, end }) => ({
        month,
        count: await this.prisma.patient.count({
          where: { createdAt: { lte: end } },
        }),
      })),
    );

    const recallCompleted = await this.prisma.patient.count({
      where: { status: PatientStatus.COMPLETED },
    });
    const recallDue = await this.prisma.patient.count({
      where: { status: PatientStatus.RECALL_DUE },
    });
    const recallTotal = recallCompleted + recallDue || 1;

    const inactiveOverTime = await Promise.all(
      months.map(async ({ month, end }) => ({
        month,
        count: await this.prisma.patient.count({
          where: {
            status: PatientStatus.INACTIVE,
            updatedAt: { lte: end },
          },
        }),
      })),
    );

    return {
      appointmentsPerMonth,
      patientGrowth,
      recallCompletionRate: Math.round((recallCompleted / recallTotal) * 100),
      inactiveOverTime,
    };
  }
}
