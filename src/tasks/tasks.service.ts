import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Task } from './schemas/task.schema';
import { Model, Types, QueryFilter } from 'mongoose';
import { CreateTaskDto } from './dtos/create-task.dto';
import { UpdateTaskDto } from './dtos/update-task.dto';
import { AssignTaskDto } from './dtos/assign-task.dto';
import { AuthorizedUser } from 'src/shared/types/auth-user';
import { canAssign } from './utils/can-assign';
import { Role } from 'src/shared/types/role';
import { GetTasksQueryDto } from 'src/projects/dtos/get-tasks-query.dto';
import { CloudinaryService } from 'src/uploads/cloudinary/cloudinary.service';
import { Project } from 'src/projects/schemas/project.schema';
import { TASK_CACHE_KEYS } from './constants/cache-keys';
import { PROJECT_CACHE_KEYS } from 'src/projects/constants/cache-keys';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';

export interface AggregatedTaskResult {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  dueDate: Date;
  projectId: Types.ObjectId;
  createdBy: Types.ObjectId;
  assignedTo?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  creator: {
    id: string;
    name: string;
    avatar?: string;
  };
}

@Injectable()
export class TasksService {
  constructor(
    @InjectModel(Task.name) private taskModel: Model<Task>,
    private readonly cloudinaryService: CloudinaryService,
    @Inject(CACHE_MANAGER) private cache: Cache
  ) { }

  async createTask(dto: CreateTaskDto, userId: string) {
    const createdTask = await this.taskModel.create({
      ...dto,
      createdBy: new Types.ObjectId(userId),
      projectId: new Types.ObjectId(dto.projectId),
      assignedTo: dto.assignedTo
        ? new Types.ObjectId(dto.assignedTo)
        : undefined,
    });

    if (!createdTask) throw new InternalServerErrorException('Failed to create task. Try later please');
    await this.cache.del(TASK_CACHE_KEYS.allAdmin)
    await this.cache.del(TASK_CACHE_KEYS.allByUser(userId))
    return createdTask
  }

  async updateTask(dto: UpdateTaskDto, taskId: string, projectId: string) {
    const task = await this.taskModel
      .findOne({ _id: taskId, projectId })
      .lean()
      .exec();
    if (!task)
      throw new NotFoundException('Task not found or has been deleted');

    const updatedTask = await this.taskModel.findOneAndUpdate(
      { _id: taskId, projectId },
      dto,
      {
        returnDocument: 'after',
      },
    );

    if (!updatedTask) throw new InternalServerErrorException('Failed to update task. Try later please');
    await this.cache.del(TASK_CACHE_KEYS.details(taskId))
    await this.cache.del(TASK_CACHE_KEYS.allAdmin)
    await this.cache.del(TASK_CACHE_KEYS.allByUser(task.createdBy.toString()))
    return updatedTask
  }

  async getProjectTasks(
    projectId: string,
    user: AuthorizedUser,
    query: GetTasksQueryDto,
  ): Promise<AggregatedTaskResult[]> {
    const matchCriteria: QueryFilter<Task> = {
      projectId: new Types.ObjectId(projectId),
    };

    if (user.role !== Role.admin) {
      matchCriteria.$or = [
        { createdBy: new Types.ObjectId(user.id) },
        { assignedTo: new Types.ObjectId(user.id) },
      ];
    }

    const KEY = user.role === Role.admin ? TASK_CACHE_KEYS.allAdmin : TASK_CACHE_KEYS.allByUser(projectId)
    const cached = await this.cache.get(KEY);
    if (cached) {
      return cached as AggregatedTaskResult[]
    }

    const aggregatedTasks =
      await this.taskModel.aggregate<AggregatedTaskResult>([
        {
          $match: matchCriteria,
        },
        {
          $lookup: {
            from: 'users',
            localField: 'assignedTo',
            foreignField: '_id',
            as: 'assignedUser',
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'createdBy',
            foreignField: '_id',
            as: 'owner',
          },
        },
        {
          $unwind: { path: '$assignedUser', preserveNullAndEmptyArrays: true },
        },
        {
          $unwind: { path: '$owner', preserveNullAndEmptyArrays: true },
        },
        {
          $project: {
            _id: 0,
            id: '$_id',
            title: '$title',
            description: '$description',
            priority: '$priority',
            status: '$status',
            dueDate: '$dueDate',
            projectId: '$projectId',
            // createdBy: '$createdBy',
            assignedTo: {
              $cond: {
                if: { $ifNull: ['$assignedUser._id', false] },
                then: {
                  id: '$assignedUser._id',
                  name: '$assignedUser.name',
                  email: '$assignedUser.email',
                  avatar: '$assignedUser.avatar',
                },
                else: '$$REMOVE',
              },
            },
            creator: {
              id: '$owner._id',
              name: '$owner.name',
              avatar: '$owner.avatar',
            },
          },
        },
      ]);

    await this.cache.set(KEY, aggregatedTasks);

    return aggregatedTasks;
  }


  async deleteTask(taskId: string, user: AuthorizedUser, task: Task) {
    if (task.assignedTo && task.assignedTo.toString() === user.id) {
      throw new ForbiddenException(
        'Access denied: Only Admins or Task creator can delete a task',
      );
    }
    const deletedTask = await this.taskModel.findOneAndDelete({ _id: taskId });
    if (!deletedTask) throw new InternalServerErrorException('Failed to delete task. Try later please');
    await this.cache.del(TASK_CACHE_KEYS.details(taskId))
    await this.cache.del(TASK_CACHE_KEYS.allAdmin)
    await this.cache.del(TASK_CACHE_KEYS.allByUser(user.id))
    return deletedTask
  }

  async assignTask(
    taskId: string,
    assignTaskDto: AssignTaskDto,
    user: AuthorizedUser,
    project: Project
  ) {
    const isMember = project.members.some(
      (m) => m.toString() === assignTaskDto.assigneeId,
    );

    if (!canAssign(user, project)) {
      throw new ForbiddenException(
        'Access denied: Only Admins or Projec owner can assign task to members',
      );
    }

    if (!isMember) {
      throw new BadRequestException(
        'Opps: The user you are looking to assign task is not member of this project. Please add him first as a member to this project',
      );
    }

    const task = await this.getTaskById(taskId);
    if (task.assignedTo) {
      throw new BadRequestException('Task is already assigned');
    }

    const updatedTask = await this.taskModel.findOneAndUpdate(
      { _id: taskId, projectId: new Types.ObjectId(assignTaskDto.projectId) },
      {
        $set: {
          assignedTo: new Types.ObjectId(assignTaskDto.assigneeId),
        },
      },
      {
        returnDocument: 'after',
      },
    );
    if (!updatedTask) throw new InternalServerErrorException('Failed to assign task. Try later please');
    await this.cache.del(TASK_CACHE_KEYS.details(taskId))
    await this.cache.del(TASK_CACHE_KEYS.allAdmin)
    await this.cache.del(TASK_CACHE_KEYS.allByUser(user.id))
    return updatedTask
  }

  async unAssign(taskId: string, user: AuthorizedUser, task: Task) {
    const updatedTask = await this.taskModel.findOneAndUpdate(
      { _id: taskId },
      {
        $unset: {
          assignedTo: 1,
        },
      },
      {
        returnDocument: 'after',
      },
    );
    if (!updatedTask) throw new InternalServerErrorException('Failed to unassign task. Try later please');
    await this.cache.del(TASK_CACHE_KEYS.details(taskId))
    await this.cache.del(TASK_CACHE_KEYS.allAdmin)
    await this.cache.del(TASK_CACHE_KEYS.allByUser(user.id))
    return updatedTask
  }

  async addAttachmentToTask(taskId: string, file: Express.Multer.File) {
    const task = await this.getTaskById(taskId);

    if (task.attachment && task.attachment.publicId) {
      await this.cloudinaryService.destroyFile(task.attachment.publicId);
    }

    const result = await this.cloudinaryService.uploadAttachment(file);

    const updatedTask = await this.taskModel.findOneAndUpdate(
      { _id: new Types.ObjectId(taskId) },
      {
        $set: {
          'attachment.url': result.secure_url,
          'attachment.publicId': result.public_id,
        },
      },
      { returnDocument: 'after' },
    );
    if (!updatedTask) throw new InternalServerErrorException('Failed to add attachment to task. Try later please');
    await this.cache.del(TASK_CACHE_KEYS.details(taskId))
    await this.cache.del(TASK_CACHE_KEYS.allAdmin)
    await this.cache.del(TASK_CACHE_KEYS.allByUser(task.createdBy.toString()))
    return updatedTask

  }

  async getTaskById(id: string) {
    const cache = await this.cache.get(TASK_CACHE_KEYS.details(id));
    if (cache) return cache as Task;
    const task = await this.taskModel
      .findOne({ _id: new Types.ObjectId(id) })
      .lean()
      .exec();
    if (!task)
      throw new NotFoundException('Task not found or has already been deleted');
    await this.cache.set(TASK_CACHE_KEYS.details(id), task)
    return task;
  }
}
