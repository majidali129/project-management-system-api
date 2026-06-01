import {
  IsDateString,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { TaskPriority } from '../types/task-priority';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(5, {
    message: 'Title must be 5 characters long',
  })
  title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(300, {
    message: 'Description cannot exceeds 300 characters',
  })
  description: string;

  @IsEnum(TaskPriority, {
    message: `Task priority could be either ${Object.values(TaskPriority).join(', ')}`,
  })
  @IsNotEmpty()
  priority: TaskPriority;

  @IsDateString({}, { message: 'dueDate must be a valid ISO date string' })
  @IsNotEmpty()
  dueDate: string;

  @IsMongoId({ message: 'assignedTo must be a valid MongoDB ObjectId' })
  @IsOptional()
  assignedTo?: string;

  @IsMongoId({ message: 'projectId must be a valid MongoDB ObjectId' })
  @IsNotEmpty()
  projectId: string;
}
