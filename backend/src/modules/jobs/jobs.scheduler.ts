import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUE_NAME } from './jobs.processor';

@Injectable()
export class JobsScheduler implements OnModuleInit {
  private readonly logger = new Logger(JobsScheduler.name);

  constructor(@InjectQueue(QUEUE_NAME) private queue: Queue) {}

  async onModuleInit() {
    await this.queue.add(
      'daily-reminders',
      { type: 'daily-reminders' },
      {
        repeat: { pattern: '0 8 * * *' },
        jobId: 'daily-reminders',
      },
    );

    await this.queue.add(
      'nightly-status-update',
      { type: 'nightly-status-update' },
      {
        repeat: { pattern: '0 2 * * *' },
        jobId: 'nightly-status-update',
      },
    );

    this.logger.log('Scheduled jobs registered');
  }
}
