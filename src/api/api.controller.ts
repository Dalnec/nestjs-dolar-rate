import { Controller, DefaultValuePipe, Get, Query } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { ApiService } from './api.service';
import { GetLastRateDto } from './dto/get-last-rate.dto';

@Controller('rate')
export class ApiController {
  constructor(
    private readonly apiService: ApiService,
    private schedulerRegistry: SchedulerRegistry,
  ) {}

  @Get('last')
  async getLastRate(): Promise<GetLastRateDto> {
    const rate = await this.apiService.getLastRate();
    return rate;
  }

  @Get()
  getRate() {
    return this.apiService.getRate();
  }

  @Get('list')
  getRates(
    @Query('take') take: number,
    @Query('skip') skip: number,
    @Query('date', new DefaultValuePipe('')) date: string,
  ) {
    return this.apiService.getRates(+take, +skip, date);
  }

  @Get('/control/')
  activateCron() {
    const job = this.schedulerRegistry.getCronJob('getting-rates');
    let message = '';
    if (job.running) {
      job.stop();
      message = 'Task Stoped!';
    } else {
      job.start();
      message = 'Task Running!';
    }
    return { message };
  }
}
