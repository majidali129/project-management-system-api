import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Request } from 'express';
import { Project } from '../schemas/project.schema';
import { Model, Types } from 'mongoose';
import { Role } from 'src/shared/types/role';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { PROJECT_CACHE_KEYS, PROJECT_CACHE_TTL } from '../constants/cache-keys';
import { normalizeItem } from 'src/shared/utils/normalize-response';

export class ProjectAccessGuard implements CanActivate {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<Project>,
    @Inject(CACHE_MANAGER) private cache: Cache
  ) {}
  async canActivate(ctx: ExecutionContext) {
    const req: Request = ctx.switchToHttp().getRequest();
    const user = req.user;
    // Check if projectId is provided in either params or body
    const body = req.body as Record<string, any>;
    const projectIdFromParams = req.params.projectId as string;
    const projectIdFromBody = body?.projectId as string;
    const projectId = projectIdFromParams ?? projectIdFromBody;

    if (!projectId) return true;

    if (!Types.ObjectId.isValid(projectId)) {
      throw new BadRequestException('Invalid project id');
    }

    let project = await this.cache.get<Project & { _id: Types.ObjectId }>(PROJECT_CACHE_KEYS.details(projectId));
    if (!project) {
      project = await this.projectModel.findById(projectId).lean().exec() as Project & { _id: Types.ObjectId }

     if(!project)  throw new NotFoundException('Project not found  Or hase been deleted');
     await this.cache.set(
      PROJECT_CACHE_KEYS.details(projectId),
      project,
      PROJECT_CACHE_TTL.details,
    );
    }
    const isAdmin = user.role === Role.admin;
    const isOwner = project.ownerId.toString() === user.id;
    const isMember = project.members.some(
      (member) => member.toString() === user.id,
    );

    if (!isAdmin && !isOwner && !isMember) {
      throw new ForbiddenException(
        'Access denied: You are not authorized to perform this action',
      );
    }

    req['project'] = normalizeItem(project) as unknown as Project & { _id: Types.ObjectId };
    return true;
  }
}
