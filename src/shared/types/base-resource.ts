import { Types } from 'mongoose';

export interface BaseResource {
  _id: Types.ObjectId;
  ownerId?: Types.ObjectId;
  userId?: Types.ObjectId;
  createdBy?: Types.ObjectId;
  [key: string]: any;
}
