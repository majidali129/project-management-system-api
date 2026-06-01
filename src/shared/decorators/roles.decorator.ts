import { SetMetadata } from '@nestjs/common';
import { Role } from '../types/role';

export const ROLES_KEYS = 'role';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEYS, roles);
