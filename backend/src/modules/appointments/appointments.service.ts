import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import {
  AppointmentStatus,
  PatientStatus,
  ActivityAction,
} from '@prisma/client';
import { AppointmentsRepository } from './appointments.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { ActivityService } from '../activity/activity.service';
import { PatientsService } from '../patients/patients.service';
import {
  CreateAppointmentDto,
  UpdateAppointmentDto,
  AppointmentQueryDto,
  AvailableSlotsDto,
} from './dto/appointment.dto';
import { format } from 'date-fns';

const BUSINESS_HOURS = { start: 8, end: 18 };
const SLOT_INTERVAL = 15;

@Injectable()
export class AppointmentsService {
  constructor(
    private repository: AppointmentsRepository,
    private prisma: PrismaService,
    private emailService: EmailService,
    private activityService: ActivityService,
    private patientsService: PatientsService,
  ) {}

  private getAppointmentEnd(date: Date, duration: number) {
    const end = new Date(date);
    end.setMinutes(end.getMinutes() + duration);
    return end;
  }

  private async checkConflicts(params: {
    dentistId: string;
    operatoryId?: string;
    appointmentDate: Date;
    duration: number;
    excludeId?: string;
  }) {
    const end = this.getAppointmentEnd(
      params.appointmentDate,
      params.duration,
    );
    const overlapping = await this.repository.findOverlapping({
      dentistId: params.dentistId,
      operatoryId: params.operatoryId,
      start: params.appointmentDate,
      end,
      excludeId: params.excludeId,
    });

    if (overlapping.length > 0) {
      throw new ConflictException(
        'Appointment conflicts with an existing booking',
      );
    }
  }

  async findAll(query: AppointmentQueryDto, dentistId?: string) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const where: Record<string, unknown> = {};

    if (query.start || query.end) {
      where.appointmentDate = {};
      if (query.start)
        (where.appointmentDate as Record<string, Date>).gte = new Date(
          query.start,
        );
      if (query.end)
        (where.appointmentDate as Record<string, Date>).lte = new Date(
          query.end,
        );
    }

    if (query.dentistId) where.dentistId = query.dentistId;
    if (query.patientId) where.patientId = query.patientId;
    if (dentistId) where.dentistId = dentistId;

    const [data, total] = await Promise.all([
      this.repository.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.repository.count(where),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const appointment = await this.repository.findById(id);
    if (!appointment) throw new NotFoundException('Appointment not found');
    return appointment;
  }

  async getAvailableSlots(dto: AvailableSlotsDto) {
    const date = new Date(dto.date);
    const duration = dto.duration ?? 30;
    const slots: string[] = [];

    const dayStart = new Date(date);
    dayStart.setHours(BUSINESS_HOURS.start, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(BUSINESS_HOURS.end, 0, 0, 0);

    const existing = await this.repository.findForDateRange(
      dayStart,
      dayEnd,
      dto.dentistId,
    );

    for (
      let time = dayStart.getTime();
      time + duration * 60000 <= dayEnd.getTime();
      time += SLOT_INTERVAL * 60000
    ) {
      const slotStart = new Date(time);
      const slotEnd = this.getAppointmentEnd(slotStart, duration);

      const hasConflict = existing.some((apt) => {
        const aptEnd = this.getAppointmentEnd(
          apt.appointmentDate,
          apt.duration,
        );
        return (
          slotStart < aptEnd &&
          slotEnd > apt.appointmentDate &&
          apt.status !== AppointmentStatus.CANCELLED
        );
      });

      if (!hasConflict) {
        slots.push(slotStart.toISOString());
      }
    }

    return slots;
  }

  async create(dto: CreateAppointmentDto, userId: string) {
    const appointmentDate = new Date(dto.appointmentDate);
    if (appointmentDate < new Date()) {
      throw new BadRequestException('Cannot book appointments in the past');
    }

    await this.checkConflicts({
      dentistId: dto.dentistId,
      operatoryId: dto.operatoryId,
      appointmentDate,
      duration: dto.duration,
    });

    const appointment = await this.repository.create({
      patient: { connect: { id: dto.patientId } },
      dentist: { connect: { id: dto.dentistId } },
      operatory: dto.operatoryId
        ? { connect: { id: dto.operatoryId } }
        : undefined,
      appointmentDate,
      duration: dto.duration,
      notes: dto.notes,
      status: AppointmentStatus.SCHEDULED,
    });

    await this.prisma.patient.update({
      where: { id: dto.patientId },
      data: { status: PatientStatus.APPOINTMENT_SCHEDULED },
    });

    await this.activityService.log({
      userId,
      patientId: dto.patientId,
      action: ActivityAction.APPOINTMENT_BOOKED,
      details: `Booked appointment for ${format(appointmentDate, 'MMM d, yyyy h:mm a')}`,
    });

    if (appointment.patient.email) {
      await this.emailService.sendAppointmentConfirmation({
        to: appointment.patient.email,
        patientName: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
        dentistName: appointment.dentist.name,
        date: format(appointmentDate, 'EEEE, MMMM d, yyyy'),
        time: format(appointmentDate, 'h:mm a'),
        duration: dto.duration,
        operatory: appointment.operatory?.name,
      });

      await this.activityService.log({
        userId,
        patientId: dto.patientId,
        action: ActivityAction.EMAIL_SENT,
        details: 'Appointment confirmation email sent',
      });
    }

    return appointment;
  }

  async update(id: string, dto: UpdateAppointmentDto, userId: string) {
    const existing = await this.findOne(id);
    const appointmentDate = dto.appointmentDate
      ? new Date(dto.appointmentDate)
      : existing.appointmentDate;
    const duration = dto.duration ?? existing.duration;
    const dentistId = dto.dentistId ?? existing.dentistId;

    await this.checkConflicts({
      dentistId,
      operatoryId: dto.operatoryId ?? existing.operatoryId ?? undefined,
      appointmentDate,
      duration,
      excludeId: id,
    });

    const appointment = await this.repository.update(id, {
      dentist: dto.dentistId
        ? { connect: { id: dto.dentistId } }
        : undefined,
      operatory: dto.operatoryId
        ? { connect: { id: dto.operatoryId } }
        : undefined,
      appointmentDate: dto.appointmentDate ? appointmentDate : undefined,
      duration: dto.duration,
      notes: dto.notes,
      status: dto.status,
    });

    await this.activityService.log({
      userId,
      patientId: existing.patientId,
      action: ActivityAction.APPOINTMENT_UPDATED,
      details: `Updated appointment`,
    });

    if (dto.status === AppointmentStatus.COMPLETED) {
      await this.completeAppointment(id, userId);
    }

    return appointment;
  }

  async completeAppointment(id: string, userId: string) {
    const appointment = await this.findOne(id);
    const settings = await this.prisma.clinicSettings.findUnique({
      where: { id: 'default' },
    });
    const recallMonths = settings?.recallIntervalMonths ?? 6;

    const nextRecall = new Date();
    nextRecall.setMonth(nextRecall.getMonth() + recallMonths);

    await this.prisma.patient.update({
      where: { id: appointment.patientId },
      data: {
        lastAppointment: appointment.appointmentDate,
        nextRecallDate: nextRecall,
        status: PatientStatus.COMPLETED,
      },
    });

    await this.repository.update(id, {
      status: AppointmentStatus.COMPLETED,
    });

    await this.activityService.log({
      userId,
      patientId: appointment.patientId,
      action: ActivityAction.APPOINTMENT_COMPLETED,
      details: 'Appointment completed, recall date reset',
    });

    return appointment;
  }

  async getToday(dentistId?: string) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    return this.repository.findForDateRange(start, end, dentistId);
  }

  async sendTomorrowReminders() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const tomorrowEnd = new Date(tomorrow);
    tomorrowEnd.setHours(23, 59, 59, 999);

    const appointments = await this.repository.findMany({
      where: {
        appointmentDate: { gte: tomorrow, lte: tomorrowEnd },
        status: { in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED] },
      },
    });

    for (const apt of appointments) {
      if (apt.patient.email) {
        await this.emailService.sendAppointmentReminder({
          to: apt.patient.email,
          patientName: `${apt.patient.firstName} ${apt.patient.lastName}`,
          dentistName: apt.dentist.name,
          date: format(apt.appointmentDate, 'EEEE, MMMM d, yyyy'),
          time: format(apt.appointmentDate, 'h:mm a'),
        });

        await this.activityService.log({
          patientId: apt.patientId,
          action: ActivityAction.REMINDER_SENT,
          details: 'Appointment reminder email sent',
        });
      }
    }

    return { sent: appointments.length };
  }
}
