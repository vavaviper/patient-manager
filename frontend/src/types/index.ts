export type UserRole = 'ADMIN' | 'RECEPTIONIST' | 'DENTIST';

export type PatientStatus =
  | 'NEW'
  | 'ACTIVE'
  | 'RECALL_DUE'
  | 'CONTACTED'
  | 'APPOINTMENT_SCHEDULED'
  | 'COMPLETED'
  | 'INACTIVE';

export type AppointmentStatus =
  | 'SCHEDULED'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  dentistId?: string;
}

export interface Patient {
  id: string;
  pid: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  birthDate: string;
  address?: string;
  emergencyContact?: string;
  insuranceProvider?: string;
  insuranceNumber?: string;
  notes?: string;
  status: PatientStatus;
  lastAppointment?: string;
  nextRecallDate?: string;
  createdAt: string;
  updatedAt: string;
  appointments?: Appointment[];
  medicalNotes?: MedicalNote[];
}

export interface Dentist {
  id: string;
  name: string;
  specialty: string;
  active?: boolean;
}

export interface Operatory {
  id: string;
  name: string;
  chair: string;
  active?: boolean;
}

export interface Appointment {
  id: string;
  patientId: string;
  dentistId: string;
  operatoryId?: string;
  appointmentDate: string;
  duration: number;
  status: AppointmentStatus;
  notes?: string;
  patient?: Pick<Patient, 'id' | 'pid' | 'firstName' | 'lastName' | 'phone' | 'email'>;
  dentist?: Dentist;
  operatory?: Operatory;
}

export interface MedicalNote {
  id: string;
  patientId: string;
  content: string;
  authorId?: string;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  userId?: string;
  patientId?: string;
  action: string;
  details?: string;
  timestamp: string;
  user?: { id: string; name: string; role: string };
  patient?: { id: string; pid: string; firstName: string; lastName: string };
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  link?: string;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface KanbanColumn {
  status: PatientStatus;
  patients: Patient[];
}

export interface DashboardStats {
  todayAppointments: number;
  recallDue: number;
  inactivePatients: number;
  weekAppointments: number;
  newPatients: number;
  totalPatients: number;
  revenuePlaceholder: number;
}

export interface DashboardCharts {
  appointmentsPerMonth: { month: string; count: number }[];
  patientGrowth: { month: string; count: number }[];
  recallCompletionRate: number;
  inactiveOverTime: { month: string; count: number }[];
}

export interface ClinicSettings {
  id: string;
  clinicName: string;
  address?: string;
  phone?: string;
  email?: string;
  businessHours: Record<string, { open: string; close: string; closed: boolean }>;
  reminderHoursBefore: number;
  recallIntervalMonths: number;
  inactiveYears: number;
  operatories?: Operatory[];
  dentists?: Dentist[];
}
