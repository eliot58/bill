import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from '../prisma/prisma.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [PrismaModule, HttpModule.register({
    timeout: 5000,
    maxRedirects: 5,
  })],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
