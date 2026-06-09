import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Role } from 'src/shared/types/role';

export type UserDocument = HydratedDocument<User>;

@Schema({
  timestamps: true,
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

  @Prop({
    required: [true, 'Role is required'],
    type: String,
    enum: {
      values: Object.values(Role),
      message: `Role could be either ${Object.values(Role).join(', ')}`,
    },
  })
  role: Role;

  @Prop({
    type: {
      url: { type: String, required: true },
      publicId: { type: String, required: true },
    },
  })
  avatar?: {
    url: string;
    publicId: string;
  };

  @Prop({ type: String })
  refreshToken?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
