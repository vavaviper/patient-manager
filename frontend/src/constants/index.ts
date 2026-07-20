export const PATIENT_STATUS_LABELS: Record<string, string> = {
  NEW: 'New',
  ACTIVE: 'Active',
  RECALL_DUE: 'Recall Due',
  CONTACTED: 'Contacted',
  APPOINTMENT_SCHEDULED: 'Appointment Scheduled',
  COMPLETED: 'Completed',
  INACTIVE: 'Inactive',
};

export const PATIENT_STATUS_COLORS: Record<string, string> = {
  NEW: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300',
  ACTIVE: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  RECALL_DUE: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  CONTACTED: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300',
  APPOINTMENT_SCHEDULED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  COMPLETED: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
  INACTIVE: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};

export const KANBAN_COLUMNS = [
  'RECALL_DUE',
  'CONTACTED',
  'APPOINTMENT_SCHEDULED',
  'COMPLETED',
  'INACTIVE',
] as const;

export const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard', roles: ['ADMIN', 'RECEPTIONIST', 'DENTIST'] },
  { href: '/patients', label: 'Patients', icon: 'Users', roles: ['ADMIN', 'RECEPTIONIST'] },
  { href: '/patients/table', label: 'Patient Table', icon: 'Table', roles: ['ADMIN', 'RECEPTIONIST', 'DENTIST'] },
  { href: '/appointments', label: 'Appointments', icon: 'Calendar', roles: ['ADMIN', 'RECEPTIONIST'] },
  { href: '/calendar', label: 'Calendar', icon: 'CalendarDays', roles: ['ADMIN', 'RECEPTIONIST', 'DENTIST'] },
  { href: '/schedule', label: 'Today', icon: 'Clock', roles: ['DENTIST'] },
  { href: '/activity', label: 'Activity', icon: 'Activity', roles: ['ADMIN', 'RECEPTIONIST'] },
  { href: '/settings', label: 'Settings', icon: 'Settings', roles: ['ADMIN'] },
];

export const APPOINTMENT_DURATIONS = [15, 30, 45, 60, 90, 120];
