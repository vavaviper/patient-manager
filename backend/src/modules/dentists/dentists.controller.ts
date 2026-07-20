import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { DentistsService } from './dentists.service';
import { CreateDentistDto, UpdateDentistDto } from './dto/dentist.dto';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Roles } from '../../common/decorators';
import { UserRole } from '../../common/constants';

@Controller('dentists')
@UseGuards(JwtAuthGuard)
export class DentistsController {
  constructor(private dentistsService: DentistsService) {}

  @Get()
  findAll() {
    return this.dentistsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.dentistsService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  create(@Body() dto: CreateDentistDto) {
    return this.dentistsService.create(dto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateDentistDto) {
    return this.dentistsService.update(id, dto);
  }
}
