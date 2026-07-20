import {
  IsString,
  IsDateString,
  IsInt,
  IsOptional,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AppointmentStatus } from '@prisma/client';

export class CreateAppointmentDto {
  @IsString()
  patientId: string;

  @IsString()
  dentistId: string;

  @IsOptional()
  @IsString()
  operatoryId?: string;

  @IsDateString()
  appointmentDate: string;

  @IsInt()
  @Min(15)
  @Max(240)
  duration: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateAppointmentDto {
  @IsOptional()
  @IsString()
  dentistId?: string;

  @IsOptional()
  @IsString()
  operatoryId?: string;

  @IsOptional()
  @IsDateString()
  appointmentDate?: string;

  @IsOptional()
  @IsInt()
  @Min(15)
  @Max(240)
  duration?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  status?: AppointmentStatus;
}

export class AppointmentQueryDto {
  @IsOptional()
  @IsDateString()
  start?: string;

  @IsOptional()
  @IsDateString()
  end?: string;

  @IsOptional()
  @IsString()
  dentistId?: string;

  @IsOptional()
  @IsString()
  patientId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}

export class AvailableSlotsDto {
  @IsString()
  dentistId: string;

  @IsOptional()
  @IsString()
  operatoryId?: string;

  @IsDateString()
  date: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  duration?: number;
}
