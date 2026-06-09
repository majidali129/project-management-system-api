import { Role } from "src/shared/types/role";
import { UserDocument } from "src/users/schemas/user.schema";

export class UserResponseDto {
    id: string;
    name: string;
    email: string;
    role: Role;
    avatar?: {
        url: string;
        publicId: string;
    };
    constructor(user: UserDocument) {
        this.id = user._id.toString();
        this.name = user.name;
        this.email = user.email;
        this.role = user.role;
        this.avatar = user.avatar;
    }
  }