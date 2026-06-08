import {
  IsDateString,
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { TaskPriority } from '../constants/task-priority';
import { TaskStatus } from '../constants/task-status';

export class UpdateTaskDto {
  @IsString()
  @IsOptional()
  @MinLength(5, {
    message: 'Title must be at least 5 characters long',
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

  @IsDateString({}, { message: 'dueDate must be a valid ISO date string' })
  @IsOptional()
  dueDate?: Date;

  @IsMongoId({ message: 'assignedTo must be a valid MongoDB ObjectId' })
  @IsOptional()
  assignedTo?: string;

  @IsMongoId({ message: 'projectId must be a valid MongoDB ObjectId' })
  @IsOptional()
  projectId?: string;
}
