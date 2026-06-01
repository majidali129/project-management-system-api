import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCommentDto {
  @MaxLength(200, { message: 'Comment cannot exceed 200 characters' })
  @MinLength(3, { message: 'Content must be at least 3 characters long' })
  @IsString({ message: 'Content must be a valid string' })
  @IsNotEmpty({ message: 'Content is required' })
  content: string;
}
