import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateDentistDto {
  @IsString()
  name: string;

  @IsString()
  specialty: string;

  @IsOptional()
  @IsString()
  userId?: string;
}

export class UpdateDentistDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  specialty?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
