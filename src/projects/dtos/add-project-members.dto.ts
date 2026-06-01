import { IsArray, IsNotEmpty } from 'class-validator';

export class AddProjectMembersDto {
  @IsNotEmpty({ message: 'Member IDs are required' })
  @IsArray({ message: 'Member IDs must be an array' })
  memberIds: string[];
}
