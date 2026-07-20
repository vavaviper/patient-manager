import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PatientStatus, ActivityAction } from '@prisma/client';
import { PatientsRepository } from './patients.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { ActivityService } from '../activity/activity.service';
import {
  calculatePatientStatus,
  generatePid,
} from './patient-status.util';
import {
  CreatePatientDto,
  UpdatePatientDto,
  PatientQueryDto,
  CreateMedicalNoteDto,
} from './dto/patient.dto';
import { KANBAN_COLUMNS } from '../../common/constants';

@Injectable()
export class PatientsService {
  constructor(
    private repository: PatientsRepository,
    private prisma: PrismaService,
    private activityService: ActivityService,
  ) {}

  private async getSettings() {
    const settings = await this.prisma.clinicSettings.findUnique({
      where: { id: 'default' },
    });
    return settings ?? { inactiveYears: 3, recallIntervalMonths: 6 };
  }

  private async hasUpcomingAppointment(patientId: string) {
    const count = await this.prisma.appointment.count({
      where: {
        patientId,
        appointmentDate: { gte: new Date() },
        status: { in: ['SCHEDULED', 'CONFIRMED'] },
      },
    });
    return count > 0;
  }

  async recalculateStatus(patientId: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
    });
    if (!patient) return;

    const settings = await this.getSettings();
    const hasUpcoming = await this.hasUpcomingAppointment(patientId);
    const newStatus = calculatePatientStatus(patient, hasUpcoming, settings);

    if (newStatus !== patient.status) {
      await this.repository.updateStatus(patientId, newStatus);
    }
    return newStatus;
  }

  async getKanbanBoard() {
    const columns = await Promise.all(
      KANBAN_COLUMNS.map(async (status) => ({
        status,
        patients: await this.repository.findByStatus(status),
      })),
    );
    return columns;
  }

  async findAll(query: PatientQueryDto) {
    const params = this.repository.searchQuery({
      ...query,
      recallDue: query.recallDue === 'true',
      inactive: query.inactive === 'true',
    });

    const [patients, total] = await Promise.all([
      this.repository.findMany({
        where: params.where,
        orderBy: params.orderBy,
        skip: params.skip,
        take: params.limit,
      }),
      this.repository.count(params.where),
    ]);

    return {
      data: patients,
      meta: {
        total,
        page: params.page,
        limit: params.limit,
        totalPages: Math.ceil(total / params.limit),
      },
    };
  }

  async findOne(id: string) {
    const patient = await this.repository.findById(id);
    if (!patient) throw new NotFoundException('Patient not found');
    return patient;
  }

  async create(dto: CreatePatientDto, userId: string) {
    const count = await this.repository.count();
    const pid = await generatePid(count);

    const recallDate = new Date();
    recallDate.setMonth(recallDate.getMonth() + 6);

    const patient = await this.repository.create({
      pid,
      ...dto,
      birthDate: new Date(dto.birthDate),
      nextRecallDate: recallDate,
      status: PatientStatus.NEW,
    });

    await this.activityService.log({
      userId,
      patientId: patient.id,
      action: ActivityAction.PATIENT_CREATED,
      details: `Created patient ${patient.firstName} ${patient.lastName} (${pid})`,
    });

    return patient;
  }

  async update(id: string, dto: UpdatePatientDto, userId: string) {
    await this.findOne(id);

    const patient = await this.repository.update(id, {
      ...dto,
      birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
      nextRecallDate: dto.nextRecallDate
        ? new Date(dto.nextRecallDate)
        : undefined,
    });

    await this.activityService.log({
      userId,
      patientId: id,
      action: ActivityAction.PATIENT_UPDATED,
      details: `Updated patient profile`,
    });

    return patient;
  }

  async updateStatus(id: string, status: PatientStatus, userId: string) {
    const patient = await this.findOne(id);
    const allowedManual: PatientStatus[] = [
      PatientStatus.CONTACTED,
      PatientStatus.COMPLETED,
      PatientStatus.RECALL_DUE,
      PatientStatus.APPOINTMENT_SCHEDULED,
      PatientStatus.INACTIVE,
    ];

    if (!allowedManual.includes(status)) {
      throw new BadRequestException('Invalid manual status transition');
    }

    const updated = await this.repository.updateStatus(id, status);

    await this.activityService.log({
      userId,
      patientId: id,
      action: ActivityAction.STATUS_CHANGED,
      details: `Status changed from ${patient.status} to ${status}`,
    });

    return updated;
  }

  async addMedicalNote(
    patientId: string,
    dto: CreateMedicalNoteDto,
    userId: string,
  ) {
    await this.findOne(patientId);
    return this.prisma.medicalNote.create({
      data: {
        patientId,
        content: dto.content,
        authorId: userId,
      },
    });
  }

  async exportCsv(query: PatientQueryDto) {
    const params = this.repository.searchQuery({
      ...query,
      recallDue: query.recallDue === 'true',
      inactive: query.inactive === 'true',
    });
    const patients = await this.repository.findAllForExport(params.where);

    const headers = [
      'PID',
      'First Name',
      'Last Name',
      'Email',
      'Phone',
      'Status',
      'Last Appointment',
      'Next Recall',
    ];
    const rows = patients.map((p) =>
      [
        p.pid,
        p.firstName,
        p.lastName,
        p.email ?? '',
        p.phone,
        p.status,
        p.lastAppointment?.toISOString().split('T')[0] ?? '',
        p.nextRecallDate?.toISOString().split('T')[0] ?? '',
      ].join(','),
    );

    return [headers.join(','), ...rows].join('\n');
  }

  async runStatusBatchUpdate() {
    const settings = await this.getSettings();
    const patients = await this.prisma.patient.findMany();
    let updated = 0;

    for (const patient of patients) {
      const hasUpcoming = await this.hasUpcomingAppointment(patient.id);
      const newStatus = calculatePatientStatus(
        patient,
        hasUpcoming,
        settings,
      );
      if (newStatus !== patient.status) {
        await this.repository.updateStatus(patient.id, newStatus);
        updated++;
      }
    }

    return { updated };
  }
}
