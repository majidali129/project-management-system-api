import {
  IsEnum,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TaskStatus } from 'src/tasks/constants/task-status';
import { TaskPriority } from 'src/tasks/constants/task-priority';

export enum SortBy {
  createdAt = 'createdAt',
  updatedAt = 'updatedAt',
  status = 'status',
  dueDate = 'dueDate',
}


export enum SortOrder {
  asc = 'asc',
  desc = 'desc',
}

export class GetTasksQueryDto {
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

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsMongoId({ message: 'Assigned user id must be a Mongodb ID' })
  assignedTo?: string;

  @IsOptional()
  @IsEnum(SortBy)
  sortBy?: SortBy;

  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder;
}
