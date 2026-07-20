import { PrismaClient, UserRole, PatientStatus, AppointmentStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';

const adapter = new PrismaPg({
  connectionString:
    process.env.DATABASE_URL ??
    'postgresql://varsha@localhost:5432/dentalflow?schema=public',
});
const prisma = new PrismaClient({ adapter });

const SPECIALTIES = [
  'General Dentistry',
  'Orthodontics',
  'Periodontics',
  'Endodontics',
  'Pediatric Dentistry',
  'Oral Surgery',
  'Prosthodontics',
  'Cosmetic Dentistry',
  'Implantology',
  'Restorative Dentistry',
];

const STATUSES: PatientStatus[] = [
  PatientStatus.NEW,
  PatientStatus.ACTIVE,
  PatientStatus.RECALL_DUE,
  PatientStatus.CONTACTED,
  PatientStatus.APPOINTMENT_SCHEDULED,
  PatientStatus.COMPLETED,
  PatientStatus.INACTIVE,
];

async function main() {
  console.log('Seeding DentalFlow database...');

  await prisma.activityLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.medicalNote.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.dentist.deleteMany();
  await prisma.operatory.deleteMany();
  await prisma.user.deleteMany();
  await prisma.clinicSettings.deleteMany();

  const password = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.create({
    data: {
      name: 'Sarah Mitchell',
      email: 'admin@dentalflow.com',
      password,
      role: UserRole.ADMIN,
    },
  });

  const receptionist = await prisma.user.create({
    data: {
      name: 'Emily Chen',
      email: 'reception@dentalflow.com',
      password,
      role: UserRole.RECEPTIONIST,
    },
  });

  await prisma.clinicSettings.create({
    data: {
      id: 'default',
      clinicName: 'DentalFlow Clinic',
      address: '123 Healthcare Blvd, Suite 200, San Francisco, CA 94102',
      phone: '(415) 555-0100',
      email: 'hello@dentalflow.com',
      businessHours: {
        monday: { open: '08:00', close: '18:00', closed: false },
        tuesday: { open: '08:00', close: '18:00', closed: false },
        wednesday: { open: '08:00', close: '18:00', closed: false },
        thursday: { open: '08:00', close: '18:00', closed: false },
        friday: { open: '08:00', close: '17:00', closed: false },
        saturday: { open: '09:00', close: '13:00', closed: false },
        sunday: { open: '09:00', close: '13:00', closed: true },
      },
      reminderHoursBefore: 24,
      recallIntervalMonths: 6,
      inactiveYears: 3,
    },
  });

  const operatories = await Promise.all(
    ['Operatory 1', 'Operatory 2', 'Operatory 3', 'Operatory 4', 'Operatory 5'].map(
      (name, i) =>
        prisma.operatory.create({
          data: { name, chair: `Chair ${String.fromCharCode(65 + i)}` },
        }),
    ),
  );

  const dentists = [];
  for (let i = 0; i < 10; i++) {
    const name = `Dr. ${faker.person.lastName()}`;
    const user =
      i === 0
        ? await prisma.user.create({
            data: {
              name,
              email: 'dentist@dentalflow.com',
              password,
              role: UserRole.DENTIST,
            },
          })
        : null;

    const dentist = await prisma.dentist.create({
      data: {
        name,
        specialty: SPECIALTIES[i],
        userId: user?.id,
      },
    });
    dentists.push(dentist);
  }

  const patients = [];
  for (let i = 0; i < 200; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const status = STATUSES[i % STATUSES.length];
    const lastAppointment =
      status === PatientStatus.INACTIVE
        ? faker.date.past({ years: 4 })
        : faker.date.recent({ days: 365 });

    const nextRecallDate =
      status === PatientStatus.RECALL_DUE
        ? faker.date.recent({ days: 30 })
        : faker.date.soon({ days: 180 });

    const patient = await prisma.patient.create({
      data: {
        pid: `DF-26-${String(i + 1).padStart(4, '0')}`,
        firstName,
        lastName,
        email: faker.internet.email({ firstName, lastName }).toLowerCase(),
        phone: faker.phone.number({ style: 'national' }),
        birthDate: faker.date.birthdate({ min: 18, max: 85, mode: 'age' }),
        address: faker.location.streetAddress({ useFullAddress: true }),
        emergencyContact: `${faker.person.fullName()} - ${faker.phone.number({ style: 'national' })}`,
        insuranceProvider: faker.helpers.arrayElement([
          'Delta Dental',
          'Cigna',
          'Aetna',
          'MetLife',
          'Guardian',
          'Blue Cross',
        ]),
        insuranceNumber: faker.string.alphanumeric(10).toUpperCase(),
        notes: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.3 }),
        status,
        lastAppointment,
        nextRecallDate,
      },
    });
    patients.push(patient);
  }

  const appointmentStatuses = [
    AppointmentStatus.SCHEDULED,
    AppointmentStatus.CONFIRMED,
    AppointmentStatus.COMPLETED,
    AppointmentStatus.CANCELLED,
    AppointmentStatus.NO_SHOW,
  ];

  for (let i = 0; i < 500; i++) {
    const patient = faker.helpers.arrayElement(patients);
    const dentist = faker.helpers.arrayElement(dentists);
    const operatory = faker.helpers.arrayElement(operatories);
    const isPast = i < 350;
    const appointmentDate = isPast
      ? faker.date.recent({ days: 730 })
      : faker.date.soon({ days: 60 });

    appointmentDate.setMinutes(
      faker.helpers.arrayElement([0, 15, 30, 45]),
    );
    appointmentDate.setHours(
      faker.number.int({ min: 8, max: 16 }),
    );

    await prisma.appointment.create({
      data: {
        patientId: patient.id,
        dentistId: dentist.id,
        operatoryId: operatory.id,
        appointmentDate,
        duration: faker.helpers.arrayElement([30, 45, 60, 90]),
        status: isPast
          ? faker.helpers.arrayElement([
              AppointmentStatus.COMPLETED,
              AppointmentStatus.CANCELLED,
              AppointmentStatus.NO_SHOW,
            ])
          : faker.helpers.arrayElement([
              AppointmentStatus.SCHEDULED,
              AppointmentStatus.CONFIRMED,
            ]),
        notes: faker.helpers.maybe(() => faker.lorem.sentence(), {
          probability: 0.2,
        }),
      },
    });
  }

  await prisma.notification.createMany({
    data: [
      {
        userId: admin.id,
        title: 'Welcome to DentalFlow',
        message: 'Your clinic management platform is ready.',
        type: 'SYSTEM',
      },
      {
        userId: receptionist.id,
        title: '3 Recall Due Patients',
        message: 'Patients need to be contacted for recall appointments.',
        type: 'RECALL',
        read: false,
      },
    ],
  });

  console.log('Seed completed:');
  console.log('  - 3 users (admin, receptionist, dentist)');
  console.log('  - 10 dentists');
  console.log('  - 200 patients');
  console.log('  - 500 appointments');
  console.log('  - 5 operatories');
  console.log('');
  console.log('Login credentials (password: password123):');
  console.log('  admin@dentalflow.com');
  console.log('  reception@dentalflow.com');
  console.log('  dentist@dentalflow.com');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
