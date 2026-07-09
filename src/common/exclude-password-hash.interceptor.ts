import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ExcludePasswordHashInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => this.stripPasswordHash(data)),
    );
  }

  private stripPasswordHash(data: any): any {
    if (data === null || data === undefined) {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.stripPasswordHash(item));
    }

    if (typeof data === 'object') {
      // In JS, Date objects, Decimal objects from Prisma, etc., are also objects.
      // We should only process plain objects/records.
      if (data instanceof Date) {
        return data;
      }
      // Check if it's a Decimal from prisma/client
      if (data.constructor && data.constructor.name === 'Decimal') {
        return data;
      }

      const copy = { ...data };
      if ('passwordHash' in copy) {
        delete copy.passwordHash;
      }
      // Traverse nested objects
      for (const key of Object.keys(copy)) {
        if (copy[key] && typeof copy[key] === 'object') {
          copy[key] = this.stripPasswordHash(copy[key]);
        }
      }
      return copy;
    }

    return data;
  }
}
