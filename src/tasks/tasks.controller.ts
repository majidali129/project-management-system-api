import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dtos/create-task.dto';
import { User } from 'src/shared/decorators/user.decorator';
import type { AuthorizedUser } from 'src/shared/types/auth-user';
import { UpdateTaskDto } from './dtos/update-task.dto';
import { AssignTaskDto } from './dtos/assign-task.dto';
import { AuthGuard } from 'src/shared/guards/auth.guard';
import { ProjectAccessGuard } from 'src/projects/guards/project-access.guard';
import type { Request } from 'express';
import { TaskAccessGuard } from './guards/task-access-guard';

@Controller('tasks')
@UseGuards(AuthGuard)
export class TasksController {
  constructor(private readonly taskService: TasksService) {}

  @Post()
  @UseGuards(ProjectAccessGuard)
  async createTask(@Body() dto: CreateTaskDto, @User() user: AuthorizedUser) {
    const createdTask = await this.taskService.createTask(dto, user.id);
    return {
      success: true,
      status: HttpStatus.CREATED,
      message: 'Task created successfully',
      task: createdTask,
    };
  }

  @Patch(':id')
  @UseGuards(TaskAccessGuard)
  async updateTask(
    @Req() req: Request,
    @Body() dto: UpdateTaskDto,
    @Param('id') id: string,
  ) {
    const updatedTask = await this.taskService.updateTask(
      dto,
      id,
      req.project._id.toString(),
    );
    return {
      success: true,
      status: HttpStatus.OK,
      message: 'Task updated successfully',
      task: updatedTask,
    };
  }

  @Get(':id')
  @UseGuards(TaskAccessGuard)
  getTaskDetails(@Req() req: Request) {
    return {
      success: true,
      status: HttpStatus.OK,
      message: 'Task fetched successfully',
      task: req.task,
    };
  }

  @Delete(':id')
  @UseGuards(TaskAccessGuard)
  async deleteTask(@Req() req: Request, @Param('id') id: string) {
    const deletedTask = await this.taskService.deleteTask(id, req.user);

    return {
      success: true,
      status: HttpStatus.OK,
      message: 'Task deleted successfully',
      deletedTask,
    };
  }

  @Patch(':id/assign-task')
  async assignTask(
    @Param('id') id: string,
    @Req() req: Request,
    @Body() dto: AssignTaskDto,
  ) {
    const assignedTask = await this.taskService.assignTask(id, dto, req.user);
    return {
      success: true,
      status: HttpStatus.OK,
      message: `Task assigned successfully`,
      task: assignedTask,
    };
  }

  @Delete(':id/unassign-task')
  async unAssignTask(@Param('id') id: string) {
    const updatedTask = await this.taskService.unAssign(id);
    return {
      success: true,
      status: HttpStatus.OK,
      message: `Task un-ssigned successfully`,
      task: updatedTask,
    };
  }
}
