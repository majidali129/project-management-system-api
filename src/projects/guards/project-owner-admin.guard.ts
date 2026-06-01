import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Request } from 'express';
import { Project } from '../schemas/project.schema';
import { Model } from 'mongoose';
import { Role } from 'src/shared/types/role';

export class ProjectOwnerOrAdminGuard implements CanActivate {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<Project>,
  ) {}
  async canActivate(ctx: ExecutionContext) {
    const req: Request = ctx.switchToHttp().getRequest();
    const params = req.params;
    const body = req.body as Record<string, any>;
    const projectIdFromParams =
      (params?.projectId as string) || (params?.id as string);
    const projectIdFromBody = body?.projectId as string;
    const projectId = projectIdFromParams || projectIdFromBody;
    const user = req.user;

    if (!projectId) return true;
    const project = await this.projectModel.findById(projectId).lean().exec();
    if (!project) throw new NotFoundException('Project not found');
    const isOwner = project.ownerId.toString() === user.id;
    const isAdmin = user.role === Role.admin;
    if (!isAdmin && !isOwner) {
      throw new ForbiddenException(
        'You do not have permission to perform this action',
      );
    }
    req['project'] = project;
    return true;
  }
}
