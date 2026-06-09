import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { CreateProjectDto } from './dtos/create-project.dto';
import { ProjectsService } from './projects.service';
import { UpdateProjectDto } from './dtos/update-project.dto';
import { UpdateProjectStatusDto } from './dtos/toggle-project-status.dto';
import { User } from 'src/shared/decorators/user.decorator';
import type { AuthorizedUser } from 'src/shared/types/auth-user';
import { AuthGuard } from 'src/shared/guards/auth.guard';
import { AddProjectMembersDto } from './dtos/add-project-members.dto';
import { ProjectOwnerOrAdminGuard } from './guards/project-owner-admin.guard';
import { ProjectAccessGuard } from './guards/project-access.guard';
import { GetTasksQueryDto } from './dtos/get-tasks-query.dto';
import type { Request } from 'express';
import { GetProjectsQueryDto } from './dtos/get-projects-query.dto';

@Controller('projects')
@UseGuards(AuthGuard)
export class ProjectsController {
  constructor(
    private readonly projectService: ProjectsService,
  ) {}

  @Post()
  async createProject(
    @Body() createProjectDto: CreateProjectDto,
    @User() user: AuthorizedUser,
  ) {
    const createdProject = await this.projectService.createProject(
      user.id,
      createProjectDto,
    );

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Project created successfully',
      project: createdProject,
    };
  }

  @Patch(':projectId')
  @UseGuards(ProjectOwnerOrAdminGuard)
  async updateProject(
    @Body() updateProjectDto: UpdateProjectDto,
    @Param('projectId') projectId: string,
  ) {
    const updatedProject = await this.projectService.updateProject(
      projectId,
      updateProjectDto,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Project updated successfully',
      project: updatedProject,
    };
  }

  @Patch(':projectId/toggle-status')
  @UseGuards(ProjectOwnerOrAdminGuard)
  async toggleProjectStatus(
    @Param('projectId') projectId: string,
    @Body() updateProjectStatusDto: UpdateProjectStatusDto,
  ) {
    const updatedProject = await this.projectService.toggleProjectStatus(
      projectId,
      updateProjectStatusDto,
    );

    return {
      statusCode: HttpStatus.OK,
      message: `Project status updated to ${updateProjectStatusDto.status} successfully`,
      project: updatedProject,
    };
  }
  @Get()
  async getAllProjects(
    @User() user: AuthorizedUser,
    @Query(new ValidationPipe({ transform: true })) query: GetProjectsQueryDto,
  ) {
    const { items, metadata } = await this.projectService.getAllProjects(
      user,
      query,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Projects fetched successfully',
      data: {
        items,
        metadata,
      },
    };
  }

  @Get(':projectId')
  @UseGuards(ProjectAccessGuard)
  async getProjectDetails(@Param('projectId') projectId: string, @Req() req: Request) {
    const project = await this.projectService.getProjectDetails(projectId, req.project);
    return {
      statusCode: HttpStatus.OK,
      message: 'Project details fetched successfully',
      project,
    };
  }

  @Get(':projectId/members')
  @UseGuards(ProjectOwnerOrAdminGuard)
  async getProjectMembers(@Param('projectId') projectId: string) {
    const members = await this.projectService.getProjectMembers(projectId);
    return {
      statusCode: HttpStatus.OK,
      message: 'Project members fetched successfully',
      members,
    };
  }

  @Post(':projectId/members')
  @UseGuards(ProjectOwnerOrAdminGuard)
  async addProjectMemebers(
    @Param('projectId') projectId: string,
    @Body() addMembersDto: AddProjectMembersDto,
  ) {
    const project = await this.projectService.addProjectMemebers(
      projectId,
      addMembersDto,
    );

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Member added successfully',
      project,
    };
  }

  @Delete(':projectId/members/:memberId')
  @UseGuards(ProjectOwnerOrAdminGuard)
  async removeProjectMember(
    @Param('projectId') projectId: string,
    @Param('memberId') memberId: string,
  ) {
    const project = await this.projectService.removeProjectMember(
      projectId,
      memberId,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Member removed successfully',
      project,
    };
  }

  @Delete(':projectId')
  @UseGuards(ProjectOwnerOrAdminGuard)
  async deleteProject(@Param('projectId') projectId: string) {
    await this.projectService.deleteProject(projectId);

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Project deleted successfully',
    };
  }

  @Get(':projectId/tasks')
  @UseGuards(ProjectAccessGuard)
  async getProjectTasks(
    @Param('projectId') projectId: string,
    @User() user: AuthorizedUser,
    @Query(new ValidationPipe({ transform: true })) query: GetTasksQueryDto,
  ) {
    const {items, metadata} = await this.projectService.getProjectTasks(
      projectId,
      user,
      query,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Tasks for this project fetched successfully',
      data: { items, metadata },
    };
  }
}
