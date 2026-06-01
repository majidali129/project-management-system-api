import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Comment } from './schemas/comment.schema';
import { Model, Types } from 'mongoose';
import { AuthorizedUser } from 'src/shared/types/auth-user';
import { TasksService } from 'src/tasks/tasks.service';

@Injectable()
export class CommentsService {
  constructor(
    @InjectModel(Comment.name) private commentModel: Model<Comment>,
    private readonly taskService: TasksService,
  ) {}
  async create(
    taskId: string,
    user: AuthorizedUser,
    createCommentDto: CreateCommentDto,
  ) {
    await this.taskService.getTaskById(taskId);
    return await this.commentModel.create({
      ...createCommentDto,
      userId: new Types.ObjectId(user.id),
      taskId: new Types.ObjectId(taskId),
    });
  }

  async findAll(taskId: string) {
    return await this.commentModel
      .find({ taskId: new Types.ObjectId(taskId) })
      .lean()
      .exec();
  }

  async findOne(id: string, taskId: string) {
    return await this.getById(id, taskId);
  }

  async update(id: string, taskId: string, updateCommentDto: UpdateCommentDto) {
    await this.getById(id, taskId);
    const updatedComment = await this.commentModel.findByIdAndUpdate(
      id,
      updateCommentDto,
      { returnDocument: 'after' },
    );

    if (!updatedComment)
      throw new InternalServerErrorException(
        'Error while updating the comment. Try again later',
      );

    return updatedComment;
  }

  async remove(id: string, taskId: string) {
    await this.getById(id, taskId);
    const deletedComment = await this.commentModel.findByIdAndDelete(id);
    if (!deletedComment)
      throw new InternalServerErrorException(
        'Error while deleting comment. Try again later',
      );
    return deletedComment;
  }

  async getById(id: string, taskId: string) {
    const comment = await this.commentModel
      .findOne({ _id: id, taskId: new Types.ObjectId(taskId) })
      .lean()
      .exec();
    if (!comment)
      throw new NotFoundException(
        'Comment not found or has already been deleted',
      );
    return comment;
  }
}
