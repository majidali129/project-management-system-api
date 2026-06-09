import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum SortBy {
  createdAt = 'createdAt',
  updatedAt = 'updatedAt',
}

export enum SortOrder {
  asc = 'asc',
  desc = 'desc',
}

export class GetProjectsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(SortBy)
  sortBy?: SortBy;

  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder;
}
