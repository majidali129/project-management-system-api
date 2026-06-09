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
import { Model, Types } from 'mongoose';
import { Role } from 'src/shared/types/role';
import { Task } from '../schemas/task.schema';
import { TASK_CACHE_KEYS, TASK_CACHE_TTL } from '../constants/cache-keys';
import { Cache } from '@nestjs/cache-manager';

export class TaskAccessGuard implements CanActivate {
  constructor(@InjectModel(Task.name) private taskModel: Model<Task>, private cache: Cache) { }
  async canActivate(ctx: ExecutionContext) {
    const req: Request = ctx.switchToHttp().getRequest();
    const user = req.user;
    const taskId = req.params.taskId as string;
    if (!taskId) return true;

    
    if (!Types.ObjectId.isValid(taskId)) {
      throw new BadRequestException('Invalid task id');
    }

    let task = await this.cache.get<Task & { _id: Types.ObjectId }>(TASK_CACHE_KEYS.details(taskId))

    if (!task) {
      task = await this.taskModel.findById(taskId).lean().exec() as Task & { _id: Types.ObjectId };
      if (!task) {
        throw new NotFoundException('Task not found OR has been deleted');
      }
      await this.cache.set(TASK_CACHE_KEYS.details(taskId), task, TASK_CACHE_TTL.details)
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
