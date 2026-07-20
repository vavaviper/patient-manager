import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JobsProcessor, QUEUE_NAME } from './jobs.processor';
import { JobsScheduler } from './jobs.scheduler';
import { AppointmentsModule } from '../appointments/appointments.module';
import { PatientsModule } from '../patients/patients.module';
import { EmailModule } from '../email/email.module';
import { ActivityModule } from '../activity/activity.module';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          url: config.get<string>('REDIS_URL') ?? 'redis://localhost:6379',
        },
      }),
    }),
    BullModule.registerQueue({ name: QUEUE_NAME }),
    AppointmentsModule,
    PatientsModule,
    EmailModule,
    ActivityModule,
  ],
  providers: [JobsProcessor, JobsScheduler],
})
export class JobsModule {}
