import { Injectable, NotFoundException } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { Project } from './schemas/project.schema';
import { CreateProjectDto } from './dtos/create-project.dto';
import { UpdateProjectDto } from './dtos/update-project.dto';
import { UpdateProjectStatusDto } from './dtos/toggle-project-status.dto';
import { InjectModel } from '@nestjs/mongoose';
import { AddProjectMembersDto } from './dtos/add-project-members.dto';
import { AuthorizedUser } from 'src/shared/types/auth-user';
import { Role } from 'src/shared/types/role';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name) private readonly projectModel: Model<Project>,
  ) {}
  async createProject(userId: string, createProjectDto: CreateProjectDto) {
    return this.projectModel.create({
      ...createProjectDto,
      ownerId: userId,
    });
  }

  async updateProject(projectId: string, updateProjectDto: UpdateProjectDto) {
    const project = await this.projectModel.findById(projectId).lean().exec();
    if (!project) {
      throw new NotFoundException('Project not found or have been deleted');
    }
    return await this.projectModel.findByIdAndUpdate(
      projectId,
      updateProjectDto,
      { returnDocument: 'after' },
    );
  }

  async toggleProjectStatus(
    projectId: string,
    updateProjectStatusDto: UpdateProjectStatusDto,
  ) {
    return this.projectModel.findByIdAndUpdate(
      projectId,
      {
        $set: {
          status: updateProjectStatusDto.status,
        },
      },
      { new: true },
    );
  }

  async getAllProjects(user: AuthorizedUser) {
    let authFilters = {};
    if (user.role !== Role.admin) {
      authFilters = {
        $or: [
          { ownerId: user.id },
          {
            members: { $in: [user.id] },
          },
        ],
      };
    }
    return await this.projectModel.find(authFilters);
  }

  async getProjectDetails(projectId: string) {
    const project = await this.projectModel.findById(projectId).lean().exec();
    if (!project)
      throw new NotFoundException('Project not found. Or hase been deleted');

    return project;
  }

  async addProjectMemebers(
    projectId: string,
    addMembersDto: AddProjectMembersDto,
  ) {
    const project = await this.projectModel.findById(projectId).exec();
    if (!project) {
      throw new NotFoundException('Project not found or no longer exits.');
    }

    return await this.projectModel.findByIdAndUpdate(
      projectId,
      {
        $set: {
          members: [...project.members, ...addMembersDto.memberIds],
        },
      },
      { returnDocument: 'after' },
    );
  }

  async removeProjectMember(projectId: string, memberId: string) {
    const project = await this.projectModel.findById(projectId).exec();
    if (!project)
      throw new NotFoundException('Project not found or hase been deleted');

    return this.projectModel.findByIdAndUpdate(
      projectId,
      {
        $pull: {
          members: memberId,
        },
      },
      { returnDocument: 'after' },
    );
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
            members: {
              $map: {
                input: '$pMembers',
                as: 'member',
                in: {
                  id: '$$member._id',
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
    return projectMembers[0]['members'];
  }

  async deleteProject(projectId: string) {
    await this.projectModel.findByIdAndDelete(projectId);
  }
}
