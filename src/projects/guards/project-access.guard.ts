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

export class ProjectAccessGuard implements CanActivate {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<Project>,
  ) {}
  async canActivate(ctx: ExecutionContext) {
    const req: Request = ctx.switchToHttp().getRequest();
    const user = req.user;
    const projectId = req.params.id as string;

    if (!projectId) return true;

    const project = await this.projectModel.findById(projectId).exec();
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    const isAdmin = user.role === Role.admin;
    const isOwner = project.ownerId.toString() === user.id;
    const isMember = project.members.some(
      (member) => member.toString() === user.id,
    );

    if (!isAdmin && !isOwner && !isMember) {
      throw new ForbiddenException(
        'Access denied: You are not authorized to view this project',
      );
    }

    req['project'] = project;
    return true;
  }
}
