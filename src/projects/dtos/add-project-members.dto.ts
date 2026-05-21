import { IsArray, IsNotEmpty } from 'class-validator';

export class AddProjectMembersDto {
  @IsNotEmpty()
  @IsArray()
  memberIds: string[];
}
