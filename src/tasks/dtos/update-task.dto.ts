import {
  IsDate,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { TaskPriority } from '../types/task-priority';
import { TaskStatus } from '../types/task-status';

export class UpdateTaskDto {
  @IsString()
  @IsOptional()
  @MinLength(5, {
    message: 'Title must be 5 characters long',
  })
  title?: string;

  @IsString()
  @IsOptional()
  @MaxLength(300, {
    message: 'Description cannot exceeds 300 characters',
  })
  description?: string;

  @IsEnum(TaskPriority, {
    message: `Task priority could be either ${Object.values(TaskPriority).join(', ')}`,
  })
  @IsOptional()
  priority?: TaskPriority;

  @IsEnum(TaskStatus, {
    message: `Task status could be either ${Object.values(TaskStatus).join(', ')}`,
  })
  @IsOptional()
  status?: TaskStatus;

  @IsDate()
  @IsOptional()
  dueDate?: Date;

  @IsString()
  @IsOptional()
  assignedTo?: string;

  @IsString()
  @IsOptional()
  projectId?: string;
}
