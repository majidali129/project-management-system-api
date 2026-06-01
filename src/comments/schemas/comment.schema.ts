import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CommentDocument = HydratedDocument<Comment>;

@Schema({
  timestamps: true,
  toJSON: {
    transform: (_doc, ret: Record<string, any>) => {
      ret['id'] = ret._id as string;
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class Comment {
  @Prop({ required: [true, 'Comment content is required'] })
  content: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'Task',
    required: [true, 'Task ID is required'],
  })
  taskId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: [true, 'Comment author ID is required'],
  })
  userId: Types.ObjectId;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);
