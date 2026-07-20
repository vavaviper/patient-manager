import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Res,
  Header,
} from '@nestjs/common';
import type { Response } from 'express';
import { PatientsService } from './patients.service';
import { ActivityService } from '../activity/activity.service';
import {
  CreatePatientDto,
  UpdatePatientDto,
  UpdatePatientStatusDto,
  PatientQueryDto,
  CreateMedicalNoteDto,
} from './dto/patient.dto';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Roles } from '../../common/decorators';
import { UserRole } from '../../common/constants';
import { User } from '../../common/decorators/user.decorator';
import type { AuthUser } from '../../common/decorators/user.decorator';

@Controller('patients')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PatientsController {
  constructor(
    private patientsService: PatientsService,
    private activityService: ActivityService,
  ) {}

  @Get('kanban')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  getKanban() {
    return this.patientsService.getKanbanBoard();
  }

  @Get('export')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  @Header('Content-Type', 'text/csv')
  async exportCsv(@Query() query: PatientQueryDto, @Res() res: Response) {
    const csv = await this.patientsService.exportCsv(query);
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=patients-export.csv',
    );
    res.send(csv);
  }

  @Get()
  findAll(@Query() query: PatientQueryDto) {
    return this.patientsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.patientsService.findOne(id);
  }

  @Get(':id/timeline')
  getTimeline(@Param('id') id: string) {
    return this.activityService.getPatientTimeline(id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  create(@Body() dto: CreatePatientDto, @User() user: AuthUser) {
    return this.patientsService.create(dto, user.id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePatientDto,
    @User() user: AuthUser,
  ) {
    return this.patientsService.update(id, dto, user.id);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST)
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdatePatientStatusDto,
    @User() user: AuthUser,
  ) {
    return this.patientsService.updateStatus(id, dto.status, user.id);
  }

  @Post(':id/notes')
  @Roles(UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.DENTIST)
  addNote(
    @Param('id') id: string,
    @Body() dto: CreateMedicalNoteDto,
    @User() user: AuthUser,
  ) {
    return this.patientsService.addMedicalNote(id, dto, user.id);
  }
}
