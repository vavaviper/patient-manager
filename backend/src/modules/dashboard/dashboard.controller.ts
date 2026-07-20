import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../common/guards';
import { User } from '../../common/decorators/user.decorator';
import type { AuthUser } from '../../common/decorators/user.decorator';
import { UserRole } from '../../common/constants';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('stats')
  getStats(@User() user: AuthUser) {
    const dentistId =
      user.role === UserRole.DENTIST ? user.dentistId : undefined;
    return this.dashboardService.getStats(dentistId);
  }

  @Get('charts')
  getCharts() {
    return this.dashboardService.getCharts();
  }
}
