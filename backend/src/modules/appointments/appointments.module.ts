import { Module } from '@nestjs/common';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { AppointmentsRepository } from './appointments.repository';
import { EmailModule } from '../email/email.module';
import { ActivityModule } from '../activity/activity.module';
import { PatientsModule } from '../patients/patients.module';

@Module({
  imports: [EmailModule, ActivityModule, PatientsModule],
  controllers: [AppointmentsController],
  providers: [AppointmentsService, AppointmentsRepository],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
