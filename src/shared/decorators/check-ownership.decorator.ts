import { SetMetadata } from '@nestjs/common';

export const CHECK_OWNERSHIP_KEY = 'resource';
export const CheckOwnerShip = (resourceName: string) =>
  SetMetadata(CHECK_OWNERSHIP_KEY, resourceName);
