import { PatientStatus, Prisma } from '@prisma/client';

export function calculatePatientStatus(
  patient: {
    status: PatientStatus;
    lastAppointment: Date | null;
    nextRecallDate: Date | null;
    createdAt: Date;
  },
  hasUpcomingAppointment: boolean,
  settings: { inactiveYears: number },
  now = new Date(),
): PatientStatus {
  const threeYearsAgo = new Date(now);
  threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - settings.inactiveYears);

  if (
    patient.lastAppointment &&
    patient.lastAppointment < threeYearsAgo &&
    !hasUpcomingAppointment
  ) {
    return PatientStatus.INACTIVE;
  }

  if (hasUpcomingAppointment) {
    return PatientStatus.APPOINTMENT_SCHEDULED;
  }

  if (patient.nextRecallDate && patient.nextRecallDate <= now) {
    if (patient.status === PatientStatus.CONTACTED) {
      return PatientStatus.CONTACTED;
    }
    return PatientStatus.RECALL_DUE;
  }

  const daysSinceCreated =
    (now.getTime() - patient.createdAt.getTime()) / (1000 * 60 * 60 * 24);
  if (!patient.lastAppointment && daysSinceCreated <= 30) {
    return PatientStatus.NEW;
  }

  if (patient.status === PatientStatus.CONTACTED) {
    return PatientStatus.CONTACTED;
  }

  if (patient.status === PatientStatus.COMPLETED) {
    return PatientStatus.COMPLETED;
  }

  return PatientStatus.ACTIVE;
}

export function buildPatientWhere(query: {
  search?: string;
  status?: PatientStatus;
  dentistId?: string;
  recallDue?: boolean;
  inactive?: boolean;
}): Prisma.PatientWhereInput {
  const where: Prisma.PatientWhereInput = {};
  const now = new Date();

  if (query.search) {
    const term = query.search.trim();
    where.OR = [
      { pid: { contains: term, mode: 'insensitive' } },
      { firstName: { contains: term, mode: 'insensitive' } },
      { lastName: { contains: term, mode: 'insensitive' } },
      { phone: { contains: term } },
      { email: { contains: term, mode: 'insensitive' } },
    ];
  }

  if (query.status) {
    where.status = query.status;
  }

  if (query.recallDue) {
    where.nextRecallDate = { lte: now };
    where.status = { notIn: [PatientStatus.INACTIVE, PatientStatus.APPOINTMENT_SCHEDULED] };
  }

  if (query.inactive) {
    where.status = PatientStatus.INACTIVE;
  }

  if (query.dentistId) {
    where.appointments = {
      some: { dentistId: query.dentistId },
    };
  }

  return where;
}

export function getPatientSort(
  sort?: string,
): Prisma.PatientOrderByWithRelationInput {
  switch (sort) {
    case 'oldest':
      return { createdAt: 'asc' };
    case 'lastAppointment':
      return { lastAppointment: 'desc' };
    case 'upcomingRecall':
      return { nextRecallDate: 'asc' };
    case 'newest':
    default:
      return { createdAt: 'desc' };
  }
}

export async function generatePid(count: number): Promise<string> {
  const year = new Date().getFullYear().toString().slice(-2);
  return `DF-${year}-${String(count + 1).padStart(4, '0')}`;
}
