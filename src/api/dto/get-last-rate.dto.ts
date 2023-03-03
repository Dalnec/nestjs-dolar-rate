import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GetLastRateDto {
  @IsOptional()
  date: string;

  @IsString()
  @IsNotEmpty()
  cost: string;

  @IsString()
  @IsNotEmpty()
  sale: string;
}
