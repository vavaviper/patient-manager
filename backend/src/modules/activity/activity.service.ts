import { Injectable } from '@nestjs/common';
import { ActivityRepository } from './activity.repository';
import { ActivityAction } from '@prisma/client';

@Injectable()
export class ActivityService {
  constructor(private repository: ActivityRepository) {}

  log(data: {
    userId?: string;
    patientId?: string;
    action: ActivityAction;
    details?: string;
  }) {
    return this.repository.create(data);
  }

  getFeed(limit = 50) {
    return this.repository.findMany({ limit });
  }

  getPatientTimeline(patientId: string) {
    return this.repository.findMany({ patientId, limit: 100 });
  }
}
