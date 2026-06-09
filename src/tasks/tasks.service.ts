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
import { Model, Types, PipelineStage } from 'mongoose';
import { CreateTaskDto } from './dtos/create-task.dto';
import { UpdateTaskDto } from './dtos/update-task.dto';
import { AssignTaskDto } from './dtos/assign-task.dto';
import { AuthorizedUser } from 'src/shared/types/auth-user';
import { canAssign } from './utils/can-assign';
import { Role } from 'src/shared/types/role';
import {
  GetTasksQueryDto,
  SortBy,
  SortOrder,
} from 'src/projects/dtos/get-tasks-query.dto';
import { CloudinaryService } from 'src/uploads/cloudinary/cloudinary.service';
import { Project } from 'src/projects/schemas/project.schema';
import { TASK_CACHE_KEYS, TASK_CACHE_TTL } from './constants/cache-keys';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';

export interface AggregatedTaskResult {
  items: {
    _id: string;
    title: string;
    description: string;
    priority: string;
    status: string;
    dueDate: Date;
    createdAt: Date;
    updatedAt: Date;
    assignedTo?: {
      _id: string;
      name: string;
      avatar: string;
    };
    owner: {
      _id: string;
      name: string;
    };
    attachment?: { url: string; publicId: string };
  }[];
  total: number;
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
    { id: userId, role }: AuthorizedUser,
    query: GetTasksQueryDto,
  ) {
    const {
      search,
      status,
      priority,
      sortBy: clientSortBy,
      sortOrder: clientSortOrder,
      assignedTo,
      limit: clientLimit,
      page: clientPage,
    } = query;

    const sortBy = new Set(Object.values(SortBy)).has(
      (clientSortBy as SortBy) || ('' as SortBy),
    )
      ? clientSortBy!
      : SortBy.createdAt;
    const sortOrder = clientSortOrder === SortOrder.asc ? 1 : -1;
    const limit = Math.min(
      clientLimit ?? +process.env.DEFAULT_LIMIT!,
      +process.env.DEFAULE_LIMIT!,
    );
    const page = clientPage ?? +process.env.DEFAULT_PAGE!;
    const skip = (page - 1) * limit;

    const initialMatch: any[] = [
      {
        projectId: new Types.ObjectId(projectId),
      },
    ];

    if (role !== Role.admin) {
      initialMatch.push({
        $or: [
          { createdBy: new Types.ObjectId(userId) },
          { assignedTo: new Types.ObjectId(userId) },
        ],
      });
    }

    const KEY = role === Role.admin ? TASK_CACHE_KEYS.allAdmin : TASK_CACHE_KEYS.allByUser(projectId)

    if (status) initialMatch.push({ status });
    if (priority) initialMatch.push({ priority });
    if (assignedTo)
      initialMatch.push({ assignedTo: new Types.ObjectId(assignedTo) });

    if (search) {
      initialMatch.push({
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ],
      });
    }

    const pipeline: PipelineStage[] = [
      {
        $match: { $and: initialMatch },
      },
      {
        $lookup: {
          from: 'users',
          let: {
            ownerId: '$createdBy',
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$_id', '$$ownerId'],
                },
              },
            },
            {
              $project: {
                _id: 1,
                name: 1,
                avatar: 1,
              },
            },
          ],
          as: 'owner',
        },
      },
      {
        $lookup: {
          from: 'users',
          let: {
            assignedTo: '$assignedTo',
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $ne: ['$$assignedTo', null] },
                    { $eq: ['$_id', '$$assignedTo'] },
                  ],
                },
              },
            },
            {
              $project: {
                _id: 1,
                name: 1,
                avatar: 1,
                createdAt: 1,
              },
            },
          ],
          as: 'assignedTo',
        },
      },
      {
        $unwind: {
          path: '$owner',
        },
      },
      {
        $unwind: {
          path: '$assignedTo',
          preserveNullAndEmptyArrays: true,
        },
      }
    ];

    pipeline.push( 
      {
      $project: {
        _id: 1,
        title: 1,
        description: 1,
        status: 1,
        priority: 1,
        dueDate: 1,
        createdAt: 1,
        updatedAt: 1,
        owner: 1,
        assignedTo: 1,
        attachment: 1,
      },
    },
    {
      $facet: {
        items: [
          {
            $sort: {
              [sortBy]: sortOrder,
            },
          }, {
            $skip: skip,
          },
          {
            $limit: limit,
          },
        ],
        meta: [
          {
            $count: 'total',
          },
        ],
      },
    },
    {
      $project: {
        items: 1,
        total: {
          $ifNull: [{ $arrayElemAt: ['$meta.total', 0] }, 0],
        },
      },
    }
    );
    

    const cached = await this.cache.get(KEY) as AggregatedTaskResult['items'];
    if (cached) {
      return {
        items: cached?? [],
        metadata: {
          page,
          limit,
          total: cached.length,
          totalPages: Math.ceil(cached.length / limit)
        }
      }
    }

    const aggregatedResult =
      await this.taskModel.aggregate<AggregatedTaskResult>(pipeline);
    const data: AggregatedTaskResult = aggregatedResult[0] || {
      items: [],
      total: 0,
    };

    await this.cache.set(KEY, data.items, role === Role.admin?  TASK_CACHE_TTL.admin: TASK_CACHE_TTL.user);

    return {
      items: data?.items ?? [],
      metadata: {
        page,
        limit,
        total: data.total,
        totalPages: Math.ceil(data.total / limit),
      },
    };
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
