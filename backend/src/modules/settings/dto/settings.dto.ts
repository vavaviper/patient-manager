import { IsString, IsOptional, IsInt, IsObject } from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional()
  @IsString()
  clinicName?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsObject()
  businessHours?: Record<string, unknown>;

  @IsOptional()
  @IsInt()
  reminderHoursBefore?: number;

  @IsOptional()
  @IsInt()
  recallIntervalMonths?: number;

  @IsOptional()
  @IsInt()
  inactiveYears?: number;

  @IsOptional()
  @IsObject()
  emailTemplates?: Record<string, unknown>;
}

export class CreateOperatoryDto {
  @IsString()
  name: string;

  @IsString()
  chair: string;
}
