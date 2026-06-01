import { IsEnum } from 'class-validator';
import { ProjectStatus } from 'src/projects/types/project-status';

export class UpdateProjectStatusDto {
  @IsEnum(ProjectStatus, {
    message: `Project status could be either ${Object.values(ProjectStatus).join(', ')}`,
  })
  status: ProjectStatus;
}
