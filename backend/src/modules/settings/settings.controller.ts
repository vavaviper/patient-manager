import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto, CreateOperatoryDto } from './dto/settings.dto';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Roles } from '../../common/decorators';
import { UserRole } from '../../common/constants';

@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @Get()
  getSettings() {
    return this.settingsService.getSettings();
  }

  @Patch()
  updateSettings(@Body() dto: UpdateSettingsDto) {
    return this.settingsService.updateSettings(dto);
  }

  @Get('operatories')
  getOperatories() {
    return this.settingsService.getOperatories();
  }

  @Post('operatories')
  createOperatory(@Body() dto: CreateOperatoryDto) {
    return this.settingsService.createOperatory(dto);
  }

  @Patch('operatories/:id')
  updateOperatory(
    @Param('id') id: string,
    @Body() dto: Partial<CreateOperatoryDto & { active: boolean }>,
  ) {
    return this.settingsService.updateOperatory(id, dto);
  }
}
