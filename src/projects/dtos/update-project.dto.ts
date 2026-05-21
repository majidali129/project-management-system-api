import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ProjectStatus } from 'src/projects/types/project-status';

export class UpdateProjectDto {
  @IsString()
  @IsOptional()
  @MinLength(3)
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(ProjectStatus, {
    message: `Project status could be either ${Object.values(ProjectStatus).join(', ')}`,
  })
  @IsOptional()
  status?: ProjectStatus;

  @IsArray()
  @IsOptional()
  members?: string[];
}
