import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { TaskStatus } from '../types/task-status';
import { TaskPriority } from '../types/task-priority';

export type TaskDocument = HydratedDocument<Task>;

@Schema({
  timestamps: true,
  toJSON: {
    transform: (_doc, ret: Record<string, any>) => {
      ret['id'] = ret._id as string;
      delete ret.__v;
      delete ret._id;
      return ret;
    },
  },
})
export class Task {
  @Prop({
    required: [true, 'Title is required'],
    minlength: [5, 'Title must be 5 characters long'],
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
}

export const TaskSchema = SchemaFactory.createForClass(Task);
