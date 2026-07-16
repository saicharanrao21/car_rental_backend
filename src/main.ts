import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ExcludePasswordHashInterceptor } from './common/exclude-password-hash.interceptor';
import { json, urlencoded } from 'express';
import { Prisma } from '@prisma/client';
import { AllExceptionsFilter } from './common/all-exceptions.filter';
import { PrismaService } from './prisma/prisma.service';

Prisma.Decimal.prototype.toJSON = function () {
  return this.toNumber();
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  // Custom body parser middleware to capture rawBody for webhook verification
  app.use(
    json({
      verify: (req: any, res, buf) => {
        if (buf && buf.length) {
          req.rawBody = buf.toString('utf8');
        }
      },
    }),
  );
  app.use(urlencoded({ extended: true }));
  app.enableCors();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalInterceptors(new ExcludePasswordHashInterceptor());

  // Register Exception Filter globally to intercept and log errors to Supabase DB
  app.useGlobalFilters(new AllExceptionsFilter(app.get(PrismaService)));

  await app.listen(process.env.PORT || 3000, '0.0.0.0');
}
bootstrap();
