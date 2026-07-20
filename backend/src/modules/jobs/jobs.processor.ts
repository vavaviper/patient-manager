import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { AppointmentsService } from '../appointments/appointments.service';
import { PatientsService } from '../patients/patients.service';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ActivityAction, PatientStatus } from '@prisma/client';
import { ActivityService } from '../activity/activity.service';
import { format } from 'date-fns';

export const QUEUE_NAME = 'dentalflow-jobs';

@Processor(QUEUE_NAME)
export class JobsProcessor extends WorkerHost {
  private readonly logger = new Logger(JobsProcessor.name);

  constructor(
    private appointmentsService: AppointmentsService,
    private patientsService: PatientsService,
    private emailService: EmailService,
    private prisma: PrismaService,
    private activityService: ActivityService,
  ) {
    super();
  }

  async process(job: Job<{ type: string }>) {
    this.logger.log(`Processing job: ${job.name}`);

    switch (job.name) {
      case 'daily-reminders':
        return this.handleDailyReminders();
      case 'nightly-status-update':
        return this.handleNightlyStatusUpdate();
      default:
        this.logger.warn(`Unknown job: ${job.name}`);
    }
  }

  private async handleDailyReminders() {
    const reminderResult =
      await this.appointmentsService.sendTomorrowReminders();

    const recallPatients = await this.prisma.patient.findMany({
      where: {
        nextRecallDate: { lte: new Date() },
        status: {
          notIn: [
            PatientStatus.INACTIVE,
            PatientStatus.APPOINTMENT_SCHEDULED,
            PatientStatus.CONTACTED,
          ],
        },
      },
    });

    for (const patient of recallPatients) {
      await this.prisma.patient.update({
        where: { id: patient.id },
        data: { status: PatientStatus.RECALL_DUE },
      });

      if (patient.email) {
        await this.emailService.sendRecallReminder({
          to: patient.email,
          patientName: `${patient.firstName} ${patient.lastName}`,
          recallDate: patient.nextRecallDate
            ? format(patient.nextRecallDate, 'MMMM d, yyyy')
            : 'Soon',
        });
      }

      await this.activityService.log({
        patientId: patient.id,
        action: ActivityAction.RECALL_GENERATED,
        details: 'Patient moved to Recall Due',
      });
    }

    return {
      remindersSent: reminderResult.sent,
      recallUpdated: recallPatients.length,
    };
  }

  private async handleNightlyStatusUpdate() {
    return this.patientsService.runStatusBatchUpdate();
  }
}
