import {
  BadRequestException,
  ForbiddenException,
  Injectable,
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
import { ProjectsService } from 'src/projects/projects.service';
import { Role } from 'src/shared/types/role';
import { GetTasksQueryDto } from 'src/projects/dtos/get-tasks-query.dto';
import { CloudinaryService } from 'src/uploads/cloudinary/cloudinary.service';

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
    private readonly projectService: ProjectsService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async createTask(dto: CreateTaskDto, userId: string) {
    return await this.taskModel.create({
      ...dto,
      createdBy: new Types.ObjectId(userId),
      projectId: new Types.ObjectId(dto.projectId),
      assignedTo: dto.assignedTo
        ? new Types.ObjectId(dto.assignedTo)
        : undefined,
    });
  }

  async updateTask(dto: UpdateTaskDto, taskId: string, projectId: string) {
    const task = await this.taskModel
      .findOne({ _id: taskId, projectId })
      .lean()
      .exec();
    if (!task)
      throw new NotFoundException('Task not found or has been deleted');

    return await this.taskModel.findOneAndUpdate(
      { _id: taskId, projectId },
      dto,
      {
        returnDocument: 'after',
      },
    );
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

    return aggregatedTasks;
  }

  async getTaskDetails(taskId: string) {
    return await this.getTaskById(taskId);
  }

  async deleteTask(taskId: string, user: AuthorizedUser) {
    const task = await this.getTaskById(taskId);
    if (task.assignedTo && task.assignedTo.toString() === user.id) {
      throw new ForbiddenException(
        'Access denied: Only Admins or Task creator can delete a task',
      );
    }
    await this.taskModel.findOneAndDelete({ _id: taskId });
  }

  async assignTask(
    taskId: string,
    assignTaskDto: AssignTaskDto,
    user: AuthorizedUser,
  ) {
    const project = await this.projectService.getProjectDetails(
      assignTaskDto.projectId,
    );
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

    return await this.taskModel.findOneAndUpdate(
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
  }
  async unAssign(taskId: string) {
    return await this.taskModel.findOneAndUpdate(
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
  }

  async addAttachmentToTask(taskId: string, file: Express.Multer.File) {
    const task = await this.taskModel.findById(taskId).exec();
    if (!task) throw new NotFoundException('Task not found');

    if (task.attachment && task.attachment.publicId) {
      await this.cloudinaryService.destroyFile(task.attachment.publicId);
    }

    const result = await this.cloudinaryService.uploadAttachment(file);

    const updatedTask = await this.taskModel.findByIdAndUpdate(
      taskId,
      {
        $set: {
          'attachment.url': result.secure_url,
          'attachment.publicId': result.public_id,
        },
      },
      { returnDocument: 'after' },
    );

    return updatedTask;
  }

  async getTaskById(id: string) {
    const task = await this.taskModel
      .findOne({ _id: new Types.ObjectId(id) })
      .lean()
      .exec();
    if (!task)
      throw new NotFoundException('Task not found or has already been deleted');
    return task;
  }
}
