export enum UserRole {
  ADMIN = 'ADMIN',
  RECEPTIONIST = 'RECEPTIONIST',
  DENTIST = 'DENTIST',
}

export enum PatientStatus {
  NEW = 'NEW',
  ACTIVE = 'ACTIVE',
  RECALL_DUE = 'RECALL_DUE',
  CONTACTED = 'CONTACTED',
  APPOINTMENT_SCHEDULED = 'APPOINTMENT_SCHEDULED',
  COMPLETED = 'COMPLETED',
  INACTIVE = 'INACTIVE',
}

export const KANBAN_COLUMNS = [
  PatientStatus.RECALL_DUE,
  PatientStatus.CONTACTED,
  PatientStatus.APPOINTMENT_SCHEDULED,
  PatientStatus.COMPLETED,
  PatientStatus.INACTIVE,
] as const;

export const MANUAL_STATUSES = [
  PatientStatus.CONTACTED,
  PatientStatus.COMPLETED,
] as const;
