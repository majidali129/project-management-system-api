import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ModuleRef, Reflector } from '@nestjs/core';
import { CHECK_OWNERSHIP_KEY } from '../decorators/check-ownership.decorator';
import type { Request } from 'express';
import { Model, Types } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { BaseResource } from '../types/base-resource';

@Injectable()
export class CheckOwnershipGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private moduleRef: ModuleRef,
  ) {}
  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const resourceName = this.reflector.getAllAndOverride<string>(
      CHECK_OWNERSHIP_KEY,
      [ctx.getHandler(), ctx.getClass()],
    );
    if (!resourceName) return true;

    const req = ctx.switchToHttp().getRequest<Request>();
    const resourceId = req.params.id as string;
    const userId = req.user.id;

    if (!resourceId || !Types.ObjectId.isValid(resourceId)) {
      throw new NotFoundException('Invalid or missing resource ID');
    }

    const formattedResourceName =
      resourceName.charAt(0).toUpperCase() + resourceName.slice(1);

    try {
      const modelToken = getModelToken(formattedResourceName);
      const dynamicModel = this.moduleRef.get<Model<BaseResource>>(modelToken, {
        strict: false,
      });

      const document = (await dynamicModel
        .findById(resourceId)
        .lean()
        .exec()) as BaseResource | null;
      if (!document) throw new NotFoundException(`${resourceName} not found`);
      const ownerId: Types.ObjectId | undefined =
        document.ownerId || document.userId || document.createdBy;

      if (
        !ownerId ||
        (ownerId.toString() !== userId && req.user.role !== 'admin')
      )
        throw new ForbiddenException(
          `You do not have permission to perform this action on this ${resourceName.toLowerCase()}`,
        );

      req[resourceName.toLowerCase()] = document;
      return true;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new ForbiddenException(`Ownership validation failed`);
    }
  }
}
