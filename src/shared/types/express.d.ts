import { Types } from 'mongoose';
import { Project } from 'src/projects/schemas/project.schema';
import { Task } from 'src/tasks/schemas/task.schema';
import { Role } from 'src/users/schemas/user.schema';

declare global {
  namespace Express {
    interface Request {
      user: {
        id: string;
        role: Role;
      };
      project: Project & { _id: Types.ObjectId };
      task: Task & { _id: Types.ObjectId };
    }
  }
}

export {};
