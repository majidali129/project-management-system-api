import { Project } from 'src/projects/schemas/project.schema';
import { AuthorizedUser } from 'src/shared/types/auth-user';
import { Role } from 'src/shared/types/role';

export const canAssign = (user: AuthorizedUser, project: Project) => {
  const isAdmin = user.role === Role.admin;
  const isProjectOwner = project.ownerId.toString() === user.id;

  return isAdmin || isProjectOwner;
};
