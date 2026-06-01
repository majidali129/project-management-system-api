import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty({ message: 'Title is required' })
  @MinLength(3, { message: 'Title must be at least 3 characters long' })
  title: string;

  @IsString()
  @IsNotEmpty({ message: 'Description is required' })
  description: string;

  @IsArray()
  @IsOptional()
  members?: string[];
}
