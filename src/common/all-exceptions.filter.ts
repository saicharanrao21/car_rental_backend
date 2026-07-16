import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly prisma: PrismaService) {}

  async catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof Error ? exception.message : 'Unknown error';
    const stack = exception instanceof Error ? exception.stack : '';

    // Save to the DB so we can inspect it remotely
    try {
      await this.prisma.notification.create({
        data: {
          userId: 'c1', // Rahul Sharma user is guaranteed to exist
          title: `SERVER_ERROR: ${status} - ${message.substring(0, 50)}`,
          body: `Path: ${request.url} | Stack: ${stack ? stack.substring(0, 800) : 'No stack'}`,
          isRead: false,
        },
      });
    } catch (dbErr) {
      console.error('Failed to log error to DB:', dbErr);
    }

    // Default NestJS error format
    response.status(status).json({
      statusCode: status,
      message: exception instanceof HttpException ? (exception.getResponse() as any).message || exception.message : message,
      error: exception instanceof HttpException ? (exception.getResponse() as any).error : 'Internal Server Error',
    });
  }
}
