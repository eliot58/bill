import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const corsOptions: CorsOptions = {
    origin: [
      'https://durak.xuton.uno',
      'http://0.0.0.0:3000',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://0.0.0.0:5173', 
      'http://localhost:5173', 
      'http://127.0.0.1:5173', 
      'null'
    ],
    credentials: true,
    methods: '*',
    allowedHeaders: ['*', 'Authorization', 'Content-Type']
  };

  app.enableCors(corsOptions);

  const config = new DocumentBuilder()
    .setTitle('XU API')
    .setDescription('The XU API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
