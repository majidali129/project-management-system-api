import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

// const Roles = ['admin', 'user'];
export enum Role {
  admin = 'admin',
  user = 'user',
}

export type UserDocument = HydratedDocument<User>;

@Schema({
  timestamps: true,
  toJSON: {
    transform: (_doc, ret: Record<string, any>) => {
      delete ret.__v;
      delete ret.password;
      delete ret._id;
    },
  },
})
export class User {
  @Prop({
    required: [true, 'Name is required'],
    minLength: [3, 'Name must be at least 3 characters long'],
  })
  name: string;

  @Prop({ required: [true, 'Email is required'], unique: true })
  email: string;

  @Prop({
    required: [true, 'Password is required'],
    min: [8, 'Password must be 8 characters long'],
  })
  password: string;

  @Prop({ required: [true, 'Role is required'], type: String, enum: Role })
  role: Role;

  @Prop({ type: String })
  avatar?: string;

  @Prop({ type: String })
  refreshToken?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
