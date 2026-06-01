import { Role } from './role';

export interface AuthorizedUser {
  id: string;
  role: Role;
}
