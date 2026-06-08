import { IsEnum } from 'class-validator';
import { TaskStatus } from '../constants/task-status';

export class toggleTaskStatusDto {
  @IsEnum(TaskStatus, {
    message: `Project status could be either ${Object.values(TaskStatus).join(', ')}`,
  })
  status: TaskStatus;
}
