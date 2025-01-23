import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { parse, validate } from './app.utils';
import { ADDRESS, ExpiredError, FEE, MIN_WITHDRAW } from './app.constants';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(
    private prisma: PrismaService
  ) {}

  async getUserByInitData(initData: string, bot: string) {
    try {
      if (bot == "durak") {
        validate(initData, process.env.DURAK_TOKEN, 5 * 60);
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
    if (!['not', 'ton', 'usdt'].includes(currency)) {
      throw new BadRequestException('Invalid currency type');
    }

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

  async withdraw(tg_id: string, currency: string, amount: number, wallet: string) {
    if (!['not', 'ton', 'usdt'].includes(currency)) {
      throw new BadRequestException('Invalid currency type');
    }

    if (amount < MIN_WITHDRAW[currency]) {
      throw new ForbiddenException(`Min withdraw ${MIN_WITHDRAW[currency]}`);
    }

    let user = await this.prisma.user.findUnique({
      where: { tg_id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user[currency] < amount + FEE[currency]) {
      throw new ForbiddenException(`Insufficient ${currency} balance`);
    }

    user = await this.prisma.user.update({
      where: { tg_id },
      data: {
        [currency]: {
          decrement: amount + FEE[currency],
        },
      },
    });

    return user;

  }

  async update_balance(tg_id: string, value: number, currency: string) {
    if (!['not', 'ton', 'usdt'].includes(currency)) {
      throw new BadRequestException('Invalid currency type');
    }
  
    const user = await this.prisma.user.findUnique({
      where: { tg_id },
    });
  
    if (!user) {
      throw new NotFoundException('User not found');
    }
  
    if (value < 0 && user[currency] + value < 0) {
      throw new ForbiddenException(`Insufficient ${currency} balance`);
    }
  
    const updatedUser = await this.prisma.user.update({
      where: { tg_id },
      data: {
        [currency]: {
          increment: value,
        },
      },
    });
  
    return updatedUser;
  }
}
