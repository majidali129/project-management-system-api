import { IsMongoId, IsNotEmpty } from 'class-validator';

export class AssignTaskDto {
  @IsMongoId({ message: 'assigneeId must be a valid MongoDB ObjectId' })
  @IsNotEmpty()
  assigneeId: string;

  @IsMongoId({ message: 'projectId must be a valid MongoDB ObjectId' })
  @IsNotEmpty()
  projectId: string;
}
