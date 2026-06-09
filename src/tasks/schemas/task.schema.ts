import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { TaskStatus } from '../constants/task-status';
import { TaskPriority } from '../constants/task-priority';

export type TaskDocument = HydratedDocument<Task>;

@Schema({
  timestamps: true,
})
export class Task {
  @Prop({
    required: [true, 'Title is required'],
    minlength: [5, 'Title must be at least 5 characters long'],
  })
  title: string;

  @Prop({
    required: [true, 'Task description is required'],
    maxlength: [300, 'Description cannot exceeds 300 characters'],
  })
  description: string;

  @Prop({
    required: [true, 'Task status is mendatory'],
    type: String,
    enum: {
      values: Object.values(TaskStatus),
      message: `Task status could be either ${Object.values(TaskStatus).join(', ')}`,
    },
    default: TaskStatus.todo,
  })
  status: TaskStatus;

  @Prop({
    required: [true, 'Task priority is required'],
    type: String,
    enum: {
      values: Object.values(TaskPriority),
      message: `Project priority could be either ${Object.values(TaskPriority).join(', ')}`,
    },
    default: TaskPriority.medium,
  })
  priority: TaskPriority;

  @Prop({ required: [true, 'Due date is required'], type: Date })
  dueDate: Date;

  @Prop({
    default: undefined,
    type: Types.ObjectId,
    ref: 'User',
  })
  assignedTo: Types.ObjectId;

  @Prop({
    required: [true, 'ID for project is required'],
    type: Types.ObjectId,
    ref: 'Project',
  })
  projectId: Types.ObjectId;

  @Prop({
    required: [true, 'ID for creator of task is required'],
    type: Types.ObjectId,
    ref: 'User',
  })
  createdBy: Types.ObjectId;

  @Prop({
    type: {
      url: { type: String, required: true },
      publicId: { type: String, required: true },
    },
  })
  attachment?: {
    url: string;
    publicId: string;
  };
}

export const TaskSchema = SchemaFactory.createForClass(Task);
