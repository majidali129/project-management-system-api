import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { Project, ProjectDocument } from './schemas/project.schema';
import { CreateProjectDto } from './dtos/create-project.dto';
import { UpdateProjectDto } from './dtos/update-project.dto';
import { UpdateProjectStatusDto } from './dtos/toggle-project-status.dto';
import { InjectModel } from '@nestjs/mongoose';
import { AddProjectMembersDto } from './dtos/add-project-members.dto';
import { AuthorizedUser } from 'src/shared/types/auth-user';
import { Role } from 'src/shared/types/role';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { PROJECT_CACHE_KEYS, PROJECT_CACHE_TTL } from './constants/cache-keys';
import { TasksService } from 'src/tasks/tasks.service';
import {
  GetProjectsQueryDto,
  SortBy,
  SortOrder,
} from './dtos/get-projects-query.dto';
import { normalizeList, normalizeItem } from 'src/shared/utils/normalize-response';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name) private readonly projectModel: Model<Project>,
    @Inject(CACHE_MANAGER) private cache: Cache,
    private readonly taskService: TasksService,
  ) { }
  async createProject(userId: string, createProjectDto: CreateProjectDto) {
   const createdProject = await this.projectModel.create({
      ...createProjectDto,
      ownerId: new Types.ObjectId(userId),
    });
    await this.cache.del(PROJECT_CACHE_KEYS.allAdmin)
    await this.cache.del(PROJECT_CACHE_KEYS.allByUser(userId))
    return normalizeItem(createdProject)
  }

  async updateProject(projectId: string, updateProjectDto: UpdateProjectDto) {
    const project = await this.projectModel.findById(projectId).lean().exec();
    if (!project) {
      throw new NotFoundException('Project not found or have been deleted');
    }
    const updatedProject =  await this.projectModel.findByIdAndUpdate(
      projectId,
      updateProjectDto,
      { returnDocument: 'after' },
    );
    if(!updatedProject) throw new InternalServerErrorException('Error while updating project. Try later please')
    await this.cache.del(PROJECT_CACHE_KEYS.details(projectId))
    await this.cache.del(PROJECT_CACHE_KEYS.allAdmin)
    await this.cache.del(PROJECT_CACHE_KEYS.allByUser(project.ownerId.toString()))
    return normalizeItem(updatedProject);
  }

  async toggleProjectStatus(
    projectId: string,
    updateProjectStatusDto: UpdateProjectStatusDto,
  ) {
    const updatedProject = await  this.projectModel.findByIdAndUpdate(
      projectId,
      {
        $set: {
          status: updateProjectStatusDto.status,
        },
      },
      { new: true },
    ).lean().exec();
    if(!updatedProject) throw new InternalServerErrorException('Error while updating project status. Try later please')

    await this.cache.del(PROJECT_CACHE_KEYS.details(projectId))
    await this.cache.del(PROJECT_CACHE_KEYS.allAdmin)
    await this.cache.del(PROJECT_CACHE_KEYS.allByUser(updatedProject.ownerId.toString()))
    return normalizeItem(updatedProject);
  }

  async getAllProjects(user: AuthorizedUser, query: GetProjectsQueryDto) {
    const {
      page: clientPage,
      limit: clientLimit,
      search,
      sortBy: clientSortBy,
      sortOrder: clientSortOrder,
    } = query;

    const sortBy = new Set(Object.values(SortBy)).has(
      (clientSortBy as SortBy) || ('' as SortBy),
    )
      ? clientSortBy!
      : SortBy.createdAt;

    const sortOrder = clientSortOrder === SortOrder.asc ? 1 : -1;
    const limit = Math.min(
      clientLimit ?? +process.env.DEFAULT_LIMIT!,
      +process.env.DEFAULT_LIMIT!,
    );
    const page = clientPage ?? +process.env.DEFAULT_PAGE!;
    const skip = (page - 1) * limit;

    const queryFilter: any[] = [];

    if (user.role !== Role.admin) {
      queryFilter.push({
        $or: [
          { ownerId: new Types.ObjectId(user.id) },
          { members: { $in: [new Types.ObjectId(user.id)] } },
        ],
      });
    }

    if (search) {
      queryFilter.push({
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ],
      });
    }
    const KEY = user.role === Role.admin ? PROJECT_CACHE_KEYS.allAdmin: PROJECT_CACHE_KEYS.allByUser(user.id)
    const cached = await this.cache.get(KEY) as ProjectDocument[]
    if (cached)  return {
      items: normalizeList(cached)?? [],
      metadata: {
        page,limit, total: cached.length,
        totalPages: Math.ceil(cached.length/limit)
      }
    }

    const finalQuery = queryFilter.length > 0 ? { $and: queryFilter } : {};
    const [items, total] = await Promise.all([
      this.projectModel
        .find(finalQuery)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit).lean()
        ,
      this.projectModel.countDocuments(finalQuery),
    ]);

    await this.cache.set(KEY, items, user.role === Role.admin? PROJECT_CACHE_TTL.admin: PROJECT_CACHE_TTL.user)

    return {
      items: normalizeList(items),
      metadata: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getProjectDetails(projectId: string, project: Project) {
    const cache = await this.cache.get(PROJECT_CACHE_KEYS.details(projectId));
    if(cache) return normalizeItem(cache) as ProjectDocument

    await this.cache.set(PROJECT_CACHE_KEYS.details(projectId), project, PROJECT_CACHE_TTL.details)
    return normalizeItem(project)
  }

  async addProjectMemebers(
    projectId: string,
    addMembersDto: AddProjectMembersDto,
  ) {
    const project = await this.projectModel.findById(projectId).exec();
    if (!project) {
      throw new NotFoundException('Project not found or no longer exits.');
    }

    const existingMemberIds = project.members.map((member) =>
      member.toString(),
    );
    const duplicateMemberIds = addMembersDto.memberIds.filter((id) =>
      existingMemberIds.includes(id),
    );

    if (duplicateMemberIds.length > 0) {
      throw new BadRequestException(
        `Members already exist in project: ${duplicateMemberIds.join(', ')}`,
      );
    }
    const updatedProject =  await this.projectModel.findByIdAndUpdate(
      projectId,
      {
        $addToSet: {
          members: {
            $each: addMembersDto.memberIds.map((id) => new Types.ObjectId(id)),
          },
        },
      },
      { returnDocument: 'after' },
    ).lean()

    if(!updatedProject) throw new InternalServerErrorException('Error while adding members to project. Try later please')
    await this.cache.del(PROJECT_CACHE_KEYS.details(projectId))
    await this.cache.del(PROJECT_CACHE_KEYS.members(projectId))
    await Promise.all(addMembersDto.memberIds.map(id => this.cache.del(PROJECT_CACHE_KEYS.allByUser(id))));
    return normalizeItem(updatedProject)
  }

  async removeProjectMember(projectId: string, memberId: string) {
    const project = await this.projectModel.findById(projectId).exec();
    if (!project)
      throw new NotFoundException('Project not found or hase been deleted');

    const isMemberExist = project.members.some(
      (member) => member.toString() === memberId,
    );

    if (!isMemberExist) {
      throw new NotFoundException(
        'Member not found in the project OR already removed',
      );
    }

    const updatedProject = await this.projectModel.findByIdAndUpdate(
      projectId,
      {
        $pull: {
          members: new Types.ObjectId(memberId),
        },
      },
      { returnDocument: 'after' },
    );

    if(!updatedProject) throw new InternalServerErrorException('Error while removing member from project. Try later please')
    await this.cache.del(PROJECT_CACHE_KEYS.details(projectId))
    await this.cache.del(PROJECT_CACHE_KEYS.members(projectId))
    await this.cache.del(PROJECT_CACHE_KEYS.allByUser(memberId))
    return normalizeItem(updatedProject);
  }

  async getProjectMembers(projectId: string) {
    interface AggregatedProject {
      _id: Types.ObjectId;
      members: {
        id: string;
        name: string;
        email: string;
        avatar: string;
      }[];
    }

    const cache = await this.cache.get(PROJECT_CACHE_KEYS.members(projectId))
    if(cache) return normalizeList(cache as AggregatedProject['members'])

    const projectMembers = await this.projectModel.aggregate<AggregatedProject>(
      [
        {
          $match: {
            _id: new Types.ObjectId(projectId),
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'members',
            foreignField: '_id',
            as: 'pMembers',
          },
        },
        {
          $project: {
            _id: 1,
            members: {
              $map: {
                input: '$pMembers',
                as: 'member',
                in: {
                  id: { $toString: '$$member._id' },
                  name: '$$member.name',
                  email: '$$member.email',
                  avatar: '$$member.avatar',
                },
              },
            },
          },
        },
      ],
    );

    await this.cache.set(PROJECT_CACHE_KEYS.members(projectId), projectMembers[0]['members'], PROJECT_CACHE_TTL.members)
    return normalizeList(projectMembers[0]['members']);
  }

  async getProjectTasks(projectId: string, user: AuthorizedUser, query) {
    return await this.taskService.getProjectTasks(
      projectId,
      user,
      query,
    );
  }

  async deleteProject(projectId: string) {
    //TODO: call tasks service to delete linked tasks with this project. also clear cache for deleted tasks
    const deletedDoc = await this.projectModel.findByIdAndDelete(projectId);
    if(!deletedDoc) return new InternalServerErrorException('Error while deleting the project. Try later please.')
    await this.cache.del(PROJECT_CACHE_KEYS.details(projectId))
    await this.cache.del(PROJECT_CACHE_KEYS.members(projectId))
    await this.cache.del(PROJECT_CACHE_KEYS.allAdmin)
    await this.cache.del(PROJECT_CACHE_KEYS.allByUser(deletedDoc.ownerId.toString()))
  }
}
