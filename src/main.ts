import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app: NestExpressApplication = await NestFactory.create(AppModule);
  const config: ConfigService = app.get(ConfigService);
  const port: number = config.get<number>('PORT');

  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidUnknownValues: false }));
  app.enableCors();

  const configsw = new DocumentBuilder()
  .setTitle('PollingAPI')
  .setDescription('The polling API description')
  .setVersion('1.0')
  .addTag('polling')
  .build();
const document = SwaggerModule.createDocument(app, configsw);
SwaggerModule.setup('api', app, document);



  await app.listen(port, () => {
    console.log('[WEB]', config.get<string>('BASE_URL'));
  });
}
bootstrap();
