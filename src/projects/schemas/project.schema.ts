import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ProjectStatus } from '../constants/project-status';

export type ProjectDocument = HydratedDocument<Project>;

@Schema({
  timestamps: true,
  
})
export class Project {
  @Prop({
    required: [true, 'Project title is required'],
    minlength: [3, 'Title must be 3 characters long'],
    maxlength: [50, "Title can't exceed 50 characters"],
    trim: true,
  })
  title: string;

  @Prop({
    required: [true, 'Project description cannot be empty'],
    maxlength: [200, 'Description cannt exceed 200 characters'],
    trim: true,
  })
  description: string;

  @Prop({
    required: [true, 'Project status is mendatory'],
    type: String,
    enum: {
      values: Object.values(ProjectStatus),
      message: `Project status could be either ${Object.values(ProjectStatus).join(', ')}`,
    },
    default: ProjectStatus.active,
  })
  status: ProjectStatus;

  @Prop({
    required: [true, 'ID for project owner is required'],
    type: Types.ObjectId,
    ref: 'User',
  })
  ownerId: Types.ObjectId;

  @Prop({
    type: [{ type: Types.ObjectId, ref: 'User' }],
    default: [],
  })
  members: Types.ObjectId[];
}

export const ProjectSchema = SchemaFactory.createForClass(Project);
