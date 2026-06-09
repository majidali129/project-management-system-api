import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from "@nestjs/common";
import type { Request, Response } from "express";
import { ApiResponse } from "../types/api-response";



@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter{
    catch(exception: HttpException, host: ArgumentsHost){
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();

        const statusCode = exception instanceof HttpException ? exception.getStatus(): HttpStatus.INTERNAL_SERVER_ERROR;
        const exceptionResponse = exception instanceof HttpException? exception.getResponse(): null;

        let message = exception.message || 'Internal server error'
        console.log('Exception: ',exceptionResponse)
        let errDetails: any = exceptionResponse;
        if(typeof exceptionResponse === 'object' && exceptionResponse !== null) {
            const resObj = exceptionResponse as any;
            message = resObj.message || message;
            errDetails = resObj.errors || resObj.message || resObj
        }

        const errorResponse: ApiResponse<null> = {
            success: false,
            statusCode,
            message,
            data: null,
            errors: errDetails,
            timestamp: new Date().toISOString()
        }

        response.status(statusCode).json(errorResponse)
    }
}