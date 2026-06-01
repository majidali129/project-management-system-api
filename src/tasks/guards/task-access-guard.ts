import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Request } from 'express';
import { Model } from 'mongoose';
import { Role } from 'src/shared/types/role';
import { Task } from '../schemas/task.schema';

export class TaskAccessGuard implements CanActivate {
  constructor(@InjectModel(Task.name) private taskModel: Model<Task>) {}
  async canActivate(ctx: ExecutionContext) {
    const req: Request = ctx.switchToHttp().getRequest();
    const user = req.user;
    const taskId = req.params.taskId as string;
    if (!taskId) return true;

    const task = await this.taskModel.findById(taskId).lean().exec();
    if (!task) {
      throw new NotFoundException('Task not found OR has been deleted');
    }

    const isAdmin = user.role === Role.admin;
    const isOwner = task.createdBy.toString() === user.id;
    const isAssignee = task.assignedTo?.toString() === user.id;

    if (!isAdmin && !isOwner && !isAssignee) {
      throw new ForbiddenException(
        'Access denied: You are not authorized to perform this action',
      );
    }

    req['task'] = task;
    return true;
  }
}
