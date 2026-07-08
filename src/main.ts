import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import helmet from 'helmet';

async function bootstrap() {
  const app: NestExpressApplication = await NestFactory.create(AppModule);
  const config: ConfigService = app.get(ConfigService);
  const port: number = config.get<number>('PORT')!;

  // Security headers (HSTS, nosniff, removes X-Powered-By, etc.).
  // CSP is disabled: this is a JSON API (CSP applies to rendered documents),
  // and the default CSP would block the non-prod Swagger UI at /api.
  app.use(helmet({ contentSecurityPolicy: false }));

  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidUnknownValues: false }));
  app.enableCors({
    origin: (origin, callback) => {
      // No Origin header (same-origin, curl, server-to-server) is always allowed.
      if (!origin || origin === process.env.WEBSITE_URL) {
        return callback(null, true);
      }
      // Outside production, allow the local Angular dev server on any localhost port.
      if (
        process.env.NODE_ENV !== 'production' &&
        /^http:\/\/localhost(:\d+)?$/.test(origin)
      ) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
  });

  if (process.env.NODE_ENV !== 'production') {
    const configsw = new DocumentBuilder()
      .setTitle('PollingAPI')
      .setDescription('The polling API description')
      .setVersion('1.0')
      .addTag('polling')
      .build();
    const document = SwaggerModule.createDocument(app, configsw);
    SwaggerModule.setup('api', app, document);
  }



  await app.listen(port, () => {
    console.log('[WEB]', config.get<string>('BASE_URL'));
  });
}
bootstrap();
