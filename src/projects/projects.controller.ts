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
import { TasksService } from 'src/tasks/tasks.service';
import { GetTasksQueryDto } from './dtos/get-tasks-query.dto';

@Controller('projects')
@UseGuards(AuthGuard)
export class ProjectsController {
  constructor(
    private readonly projectService: ProjectsService,
    private readonly taskService: TasksService,
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
      success: true,
      status: HttpStatus.CREATED,
      message: 'Project created successfully',
      project: createdProject,
    };
  }

  @Patch(':id')
  @UseGuards(ProjectOwnerOrAdminGuard)
  async updateProject(
    @Body() updateProjectDto: UpdateProjectDto,
    @Param('id') id: string,
  ) {
    const updatedProject = await this.projectService.updateProject(
      id,
      updateProjectDto,
    );

    return {
      success: true,
      status: HttpStatus.OK,
      message: 'Project updated successfully',
      project: updatedProject,
    };
  }

  @Patch(':id/toggle-status')
  @UseGuards(ProjectOwnerOrAdminGuard)
  async toggleProjectStatus(
    @Param('id') id: string,
    @Body() updateProjectStatusDto: UpdateProjectStatusDto,
  ) {
    const updatedProject = await this.projectService.toggleProjectStatus(
      id,
      updateProjectStatusDto,
    );

    return {
      success: true,
      status: HttpStatus.OK,
      message: `Project status updated to ${updateProjectStatusDto.status} successfully`,
      project: updatedProject,
    };
  }

  @Get()
  async getAllProjects(@User() user: AuthorizedUser) {
    return this.projectService.getAllProjects(user);
  }

  // Owner | Admin | Project-Member
  @Get(':id')
  @UseGuards(ProjectAccessGuard)
  async getProjectDetails(@Param('id') id: string) {
    return await this.projectService.getProjectDetails(id);
  }

  @Get(':id/members')
  @UseGuards(ProjectOwnerOrAdminGuard)
  async getProjectMembers(@Param('id') id: string) {
    const members = await this.projectService.getProjectMembers(id);
    return {
      success: true,
      status: HttpStatus.OK,
      message: 'Project members fetched successfully',
      members,
    };
  }

  @Post(':id/members')
  @UseGuards(ProjectOwnerOrAdminGuard)
  async addProjectMemebers(
    @Param('id') id: string,
    @Body() addMembersDto: AddProjectMembersDto,
  ) {
    const project = await this.projectService.addProjectMemebers(
      id,
      addMembersDto,
    );

    return {
      success: true,
      status: HttpStatus.CREATED,
      message: 'Member added successfully',
      project,
    };
  }

  @Delete(':id/members/:memberId')
  @UseGuards(ProjectOwnerOrAdminGuard)
  async removeProjectMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
  ) {
    const project = await this.projectService.removeProjectMember(id, memberId);
    return {
      success: true,
      status: HttpStatus.OK,
      message: 'Member removed successfully',
      project,
    };
  }

  @Delete(':id')
  @UseGuards(ProjectOwnerOrAdminGuard)
  async deleteProject(@Param('id') id: string) {
    await this.projectService.deleteProject(id);

    return {
      success: true,
      status: HttpStatus.OK,
      message: 'Project deleted successfully',
    };
  }

  @Get(':id/tasks')
  @UseGuards(ProjectAccessGuard)
  async getProjectTasks(
    @Param('id') id: string,
    @User() user: AuthorizedUser,
    @Query(new ValidationPipe({ transform: true })) query: GetTasksQueryDto,
  ) {
    const tasks = await this.taskService.getProjectTasks(id, user, query);
    return {
      success: true,
      status: HttpStatus.OK,
      message: 'Tasks for this project fetched successfully',
      tasks,
    };
  }
}
