import { Body, Controller, Get, Post, Headers, Query, Param, ForbiddenException, ParseIntPipe } from '@nestjs/common';
import { AppService } from './app.service';
import { DepositDto, UpdateBalanceDto, WithdrawDto } from './app.dto';
import { FEE, MIN_WITHDRAW } from './app.constants';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}


  @Get("settings")
  async getSettings() {
    return {
      fee: FEE,
      minWithdraw: MIN_WITHDRAW,
    };
  }

  @Get("user")
  async user(
    @Query('bot') bot: string,
    @Headers('X-API-Key') initData: string
  ) {
    const parseData = await this.appService.getUserByInitData(initData, bot);
    return await this.appService.getUserByTgId(parseData.user.id);
  }

  @Post("deposit")
  async deposit(
    @Query('bot') bot: string,
    @Headers('X-API-Key') initData: string,
    @Body() data: DepositDto
  ) {
    const parseData = await this.appService.getUserByInitData(initData, bot);
    return await this.appService.deposit(parseData.user.id, data.currency, data.amount * 1e9)
  }

  @Post("withdraw")
  async withdraw(
    @Query('bot') bot: string,
    @Headers('X-API-Key') initData: string,
    @Body() data: WithdrawDto
  ) {
    const parseData = await this.appService.getUserByInitData(initData, bot);
    return await this.appService.withdraw(parseData.user.id, data.currency, data.amount, data.wallet);
  }

  @Get("user/:tg_id")
  async get_user(
    @Param('tg_id') tg_id: string
  ) {
    return await this.appService.getUserByTgId(tg_id);
  }

  @Post("deposit_test/:tg_id")
  async deposit_test(
    @Param('tg_id') tg_id: string,
    @Body() data: DepositDto
  ) {
    return await this.appService.deposit(tg_id, data.currency, data.amount * 1e9)
  }

  @Post("withdraw_test/:tg_id")
  async withdraw_test(
    @Param('tg_id') tg_id: string,
    @Body() data: WithdrawDto
  ) {
    return await this.appService.withdraw(tg_id, data.currency, data.amount, data.wallet);
  }


  @Post("update_balance")
  async update_balance(
    @Headers('X-API-Key') api_key: string,
    @Body() data: UpdateBalanceDto
  ) {
    if (api_key !== process.env.API_KEY) {
      throw new ForbiddenException("Invalid Api Key");
    }

    return await this.appService.update_balance(data.tg_id, data.value, data.currency);
  }

  @Get('getInvoiceLink')
  async getInvoiceLink(
    @Query('amount', ParseIntPipe) amount: number
  ) {

    const prices = [
      { label: 'XTR', amount: 100 * amount },
    ];

    return this.appService.createInvoiceLink({
      title: `${amount} Fool`,
      description: `${amount} Fool`,
      photo_url: "https://cdn.notwise.co/energyRefill.jpg",
      payload: `${amount}`,
      currency: 'XTR',
      prices,
    });
  }


}
