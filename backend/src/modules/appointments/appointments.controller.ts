import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import {
  CreateAppointmentDto,
  UpdateAppointmentDto,
  AppointmentQueryDto,
  AvailableSlotsDto,
} from './dto/appointment.dto';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Roles } from '../../common/decorators';
import { UserRole } from '../../common/constants';
import { User } from '../../common/decorators/user.decorator';
import type { AuthUser } from '../../common/decorators/user.decorator';

@Controller('appointments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AppointmentsController {
  constructor(private appointmentsService: AppointmentsService) {}

  @Get()
  findAll(@Query() query: AppointmentQueryDto, @User() user: AuthUser) {
    const dentistFilter =
      user.role === UserRole.DENTIST ? user.dentistId : undefined;
    return this.appointmentsService.findAll(query, dentistFilter);
  }

  @Get('today')
  getToday(@User() user: AuthUser) {
    const dentistFilter =
      user.role === UserRole.DENTIST ? user.dentistId : undefined;
    return this.appointmentsService.getToday(dentistFilter);
  }

  @Get('available-slots')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  getAvailableSlots(@Query() dto: AvailableSlotsDto) {
    return this.appointmentsService.getAvailableSlots(dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.appointmentsService.findOne(id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  create(@Body() dto: CreateAppointmentDto, @User() user: AuthUser) {
    return this.appointmentsService.create(dto, user.id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAppointmentDto,
    @User() user: AuthUser,
  ) {
    return this.appointmentsService.update(id, dto, user.id);
  }

  @Post(':id/complete')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.DENTIST)
  complete(@Param('id') id: string, @User() user: AuthUser) {
    return this.appointmentsService.completeAppointment(id, user.id);
  }
}
