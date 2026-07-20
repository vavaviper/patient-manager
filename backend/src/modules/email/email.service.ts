import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import {
  appointmentConfirmationTemplate,
  appointmentReminderTemplate,
  recallReminderTemplate,
} from './templates';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend | null = null;
  private from: string;

  constructor(private config: ConfigService) {
    const apiKey = this.config.get<string>('RESEND_API_KEY');
    this.from =
      this.config.get<string>('EMAIL_FROM') ??
      'DentalFlow <onboarding@resend.dev>';
    if (apiKey) {
      this.resend = new Resend(apiKey);
    }
  }

  private async send(to: string, subject: string, html: string) {
    if (!this.resend) {
      this.logger.warn(`Email skipped (no API key): ${subject} -> ${to}`);
      return { id: 'mock', skipped: true };
    }
    return this.resend.emails.send({ from: this.from, to, subject, html });
  }

  sendAppointmentConfirmation(data: {
    to: string;
    patientName: string;
    dentistName: string;
    date: string;
    time: string;
    duration: number;
    operatory?: string;
  }) {
    return this.send(
      data.to,
      'Appointment Confirmation - DentalFlow',
      appointmentConfirmationTemplate(data),
    );
  }

  sendAppointmentReminder(data: {
    to: string;
    patientName: string;
    dentistName: string;
    date: string;
    time: string;
  }) {
    return this.send(
      data.to,
      'Appointment Reminder - DentalFlow',
      appointmentReminderTemplate(data),
    );
  }

  sendRecallReminder(data: {
    to: string;
    patientName: string;
    recallDate: string;
  }) {
    return this.send(
      data.to,
      'Recall Reminder - DentalFlow',
      recallReminderTemplate(data),
    );
  }
}
