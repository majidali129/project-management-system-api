import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import {
  BadRequestException,
  HttpStatus,
  ValidationPipe,
} from '@nestjs/common';
import { load } from 'js-yaml';
import { join } from 'path';
import { readFileSync } from 'fs';
import { SwaggerModule } from '@nestjs/swagger';
import { TransformInterceptor } from './shared/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './shared/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      stopAtFirstError: true,
      exceptionFactory(errors) {
        const formatedErrors = errors.reduce(
          (acc, err) => {
            acc[err.property] = Object.values(err.constraints!);
            return acc;
          },
          {} as Record<string, string | string[]>,
        );

        return new BadRequestException({
          message: 'Validation failed',
          errors: formatedErrors,
        });
      },
    }),
  );

  app.useGlobalInterceptors(new TransformInterceptor())
  app.useGlobalFilters(new HttpExceptionFilter())

  app.enableCors();
  const yamlPath = join(process.cwd(), 'docs/api', 'openapi.yaml');
  const fileContents = readFileSync(yamlPath, 'utf8');

  const document = load(fileContents) as Record<string, any>;

  SwaggerModule.setup('api', app, document as any);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
