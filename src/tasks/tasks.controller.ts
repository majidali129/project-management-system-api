import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  HttpStatus,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
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
import { ProjectOwnerOrAdminGuard } from 'src/projects/guards/project-owner-admin.guard';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('projects/:projectId/tasks')
@UseGuards(AuthGuard)
export class TasksController {
  constructor(private readonly taskService: TasksService) {}

  @Post()
  @UseGuards(ProjectAccessGuard)
  async createTask(@Body() dto: CreateTaskDto, @User() user: AuthorizedUser) {
    const createdTask = await this.taskService.createTask(dto, user.id);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Task created successfully',
      data: createdTask,
    };
  }

  @Patch(':taskId')
  @UseGuards(TaskAccessGuard)
  async updateTask(
    @Req() req: Request,
    @Body() dto: UpdateTaskDto,
    @Param('taskId') taskId: string,
  ) {
    const updatedTask = await this.taskService.updateTask(
      dto,
      taskId,
      req.project._id.toString(),
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Task updated successfully',
      data: updatedTask,
    };
  }

  @Get(':taskId')
  @UseGuards(ProjectAccessGuard, TaskAccessGuard)
  getTaskDetails(@Req() req: Request) {
    return {
      statusCode: HttpStatus.OK,
      message: 'Task fetched successfully',
      data: req.task,
    };
  }

  @Delete(':taskId')
  @UseGuards(ProjectAccessGuard, TaskAccessGuard)
  async deleteTask(@Req() req: Request, @Param('taskId') taskId: string) {
    const deletedTask = await this.taskService.deleteTask(taskId, req.user, req.task);

    return {
      statusCode: HttpStatus.OK,
      message: 'Task deleted successfully',
      data: deletedTask,
    };
  }

  @Patch(':taskId/assign-task')
  @UseGuards(ProjectOwnerOrAdminGuard)
  async assignTask(
    @Param('taskId') taskId: string,
    @Req() req: Request,
    @Body() dto: AssignTaskDto,
  ) {
    const assignedTask = await this.taskService.assignTask(
      taskId,
      dto,
      req.user,
      req.project
    );
    return {
      statusCode: HttpStatus.OK,
      message: `Task assigned successfully`,
      data: assignedTask,
    };
  }

  @Delete(':taskId/unassign-task')
  @UseGuards(ProjectOwnerOrAdminGuard)
  async unAssignTask(@Param('taskId') taskId: string, @Req() req: Request) {
    const updatedTask = await this.taskService.unAssign(taskId, req.user, req.task);
    return {
      statusCode: HttpStatus.OK,
      message: `Task un-assigned successfully`,
      data: updatedTask,
    };
  }

  @Patch(':taskId/attatchment')
  @UseInterceptors(FileInterceptor('attachment'))
  @UseGuards(TaskAccessGuard)
  async addAttachment(
    @Param('taskId') taskId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: 1024 * 1024 * 5,
            errorMessage: 'Attachment size cannot exceed 5MB',
          }),
          new FileTypeValidator({
            fileType: /(pdf|docx|msword|openxmlformats)/,
          }),
        ],
        fileIsRequired: false,
      }),
    )
    file: Express.Multer.File,
  ) {
    const updatedTask = await this.taskService.addAttachmentToTask(
      taskId,
      file,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Attachment uploaded successfully',
      data: updatedTask,
    };
  }
}
