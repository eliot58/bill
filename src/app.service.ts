import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { parse, validate } from './app.utils';
import { ADDRESS, DURAK_TOKEN, ExpiredError } from './app.constants';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(
    private prisma: PrismaService
  ) {}

  async getUserByInitData(initData: string, bot: string) {
    try {
      if (bot == "durak") {
        validate(initData, DURAK_TOKEN, 5 * 60);
      } else {
        throw new NotFoundException("Bot not found");
      }
    } catch (error) {
        if (error instanceof ExpiredError) {
            throw new BadRequestException("Init data expired");
        }
        throw new BadRequestException("Invalid init data");
    }

    return parse(initData);
  }

  async getUserByTgId(tg_id: string) {
    let user = await this.prisma.user.findUnique({
      where: { tg_id },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          tg_id
        },
      });
    }

    return {
      ...user,
      id: user.id.toString(),
    };
  }

  async deposit(tg_id: string, currency: string, amount: number) {
    let user = await this.prisma.user.findUnique({
      where: { tg_id },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          tg_id
        },
      });
    }

    const text = user.id

    return `ton://transfer/${ADDRESS}?amount=${amount}&text=${text}`;
  }

  async withdraw(tg_id: string, currency: string, amount: number) {
    
  }
}
