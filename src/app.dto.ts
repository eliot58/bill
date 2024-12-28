import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsDefined, IsPositive, IsNumber } from 'class-validator';


export class DepositDto {
  @ApiProperty()
  @IsString()
  @IsDefined()
  currency: string;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  @IsDefined()
  amount: number;
}


export class WithdrawDto {
  @ApiProperty()
  @IsString()
  @IsDefined()
  currency: string;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  @IsDefined()
  amount: number;


  @ApiProperty()
  @IsString()
  @IsDefined()
  wallet: string;
}