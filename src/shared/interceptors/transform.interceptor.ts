import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from 'rxjs/operators'
import { ApiResponse } from "../types/api-response";
import type { Response } from "express";



@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
    intercept(ctx: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
        const response: Response = ctx.switchToHttp().getResponse()
        const statusCode = response.statusCode;

        return next.handle().pipe(map(data => {
            const { message, ...rest } = data;
          
            return {
                success: true,
                statusCode,
                message: data.message || 'Request processed successfully',
                data: rest,
                errors: null,
                timestamp: new Date().toISOString(),
            }
        }))
    }
}