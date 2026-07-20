import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ActivityService } from './activity.service';
import { JwtAuthGuard } from '../../common/guards';

@Controller('activity')
@UseGuards(JwtAuthGuard)
export class ActivityController {
  constructor(private activityService: ActivityService) {}

  @Get()
  getFeed(@Query('limit') limit?: string) {
    return this.activityService.getFeed(limit ? parseInt(limit, 10) : 50);
  }
}
