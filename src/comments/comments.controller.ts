import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { User } from 'src/shared/decorators/user.decorator';
import type { AuthorizedUser } from 'src/shared/types/auth-user';
import { AuthGuard } from 'src/shared/guards/auth.guard';
import { CheckOwnerShip } from 'src/shared/decorators/check-ownership.decorator';
import { CheckOwnershipGuard } from 'src/shared/guards/check-ownership.guard';
import { TaskAccessGuard } from 'src/tasks/guards/task-access-guard';

@Controller('tasks/:taskId/comments')
@UseGuards(AuthGuard, TaskAccessGuard, CheckOwnershipGuard)
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  async create(
    @Param('taskId') taskId: string,
    @Body() createCommentDto: CreateCommentDto,
    @User() user: AuthorizedUser,
  ) {
    const createdComment = await this.commentsService.create(
      taskId,
      user,
      createCommentDto,
    );
    return {
      success: true,
      status: HttpStatus.CREATED,
      message: 'Comment created successfully',
      comment: createdComment,
    };
  }

  @Get()
  async findAll(@Param('taskId') taskId: string) {
    const comments = await this.commentsService.findAll(taskId);
    return {
      success: true,
      status: HttpStatus.OK,
      message: 'Comments fetched successfully',
      comments,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Param('taskId') taskId: string) {
    const comment = await this.commentsService.findOne(id, taskId);
    return {
      success: true,
      status: HttpStatus.OK,
      message: 'Comment fetched successfully',
      comment,
    };
  }

  @Patch(':id')
  @CheckOwnerShip('Comment')
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Param('taskId') taskId: string,
    @Body() updateCommentDto: UpdateCommentDto,
  ) {
    const comment = await this.commentsService.update(
      id,
      taskId,
      updateCommentDto,
    );
    return {
      success: true,
      status: HttpStatus.OK,
      message: 'Comment updated successfully',
      comment,
    };
  }

  @Delete(':id')
  @CheckOwnerShip('Comment')
  async remove(@Param('id') id: string, @Param('taskId') taskId: string) {
    await this.commentsService.remove(id, taskId);
    return {
      success: true,
      status: HttpStatus.OK,
      message: 'Comment deleted successfully',
      data: null,
    };
  }
}
