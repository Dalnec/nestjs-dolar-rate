import { HttpService } from '@nestjs/axios';
import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { catchError, firstValueFrom, map } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';
import { GetLastRateDto } from './dto/get-last-rate.dto';
import * as moment from 'moment';

@Injectable()
export class ApiService {
  constructor(private http: HttpService, private prisma: PrismaService) {}

  private readonly logger = new Logger('Probando logger');

  @Cron(CronExpression.EVERY_6_HOURS, {
    name: 'getting-rates',
    timeZone: 'America/Lima',
  })
  async handleCron() {
    try {
      this.logger.debug('Updating Dollar Rate');
      await this.getRate();
    } catch (error) {
      throw new Error(error);
    }
  }

  async getRate() {
    const headersRequest = {
      'Content-Type': 'text/plain',
    };
    return await firstValueFrom(
      this.http
        .get(`https://www.sunat.gob.pe/a/txt/tipoCambio.txt`, {
          headers: headersRequest,
        })
        .pipe(
          map(async (res) => {
            try {
              const [date, cost, sale] = res.data.split('|', 3);

              const prismadate = moment(date, 'DD/MM/YYYY').toDate();
              const strdate = moment(date, 'DD/MM/YYYY').format('YYYY-MM-DD');

              const has_changed = await this.prisma.rate.findFirst({
                where: { date: prismadate, cost, sale },
              });
              if (!has_changed) {
                await this.prisma.rate.create({
                  data: { date: prismadate, cost, sale },
                });
              }

              return { date: strdate, cost, sale };
            } catch (error) {
              throw new Error(error);
            }
          }),
        )
        .pipe(
          catchError(() => {
            throw new ForbiddenException('API not available');
          }),
        ),
    );
  }

  async getLastRate(): Promise<GetLastRateDto> {
    try {
      const rate = await this.prisma.rate.findMany({
        orderBy: { id: 'desc' },
        take: 1,
        select: { date: true, cost: true, sale: true },
      });
      console.log(rate);

      return {
        date: this.formatDateString(rate[0].date),
        cost: rate[0].cost,
        sale: rate[0].sale,
      };
    } catch (error) {
      throw new Error(error);
    }
  }

  async getRates(take: number, skip: number, searchdate: string) {
    try {
      const prismadate = moment(searchdate, 'YYYY-MM-DD').toDate();
      // const strdate = moment(searchdate, 'YYYY-MM-DD').format('YYYY-MM-DD');

      const rates = await this.prisma.rate.findMany({
        take,
        skip,
        where: {
          date: searchdate !== '' ? prismadate : undefined,
          // date: {
          //   lte: new Date('2023-03-23'),
          //   gte: new Date('2023-03-23'),
          // },
        },
        orderBy: { id: 'desc' },
        select: { date: true, cost: true, sale: true },
      });
      console.log(rates);

      return rates.map((rate) => ({
        date: moment(rate.date, 'YYYY-MM-DD').format('YYYY-MM-DD'),
        cost: rate.cost,
        sale: rate.sale,
      }));
    } catch (error) {
      throw new Error(error);
    }
  }

  formatStringDate(val: any) {
    const date = new Date(val);
    const finalDate =
      date.getFullYear() +
      '-' +
      ('0' + (date.getMonth() + 1)).slice(-2) +
      '-' +
      ('0' + (date.getDate() + 1)).slice(-2);
    return finalDate;
  }

  formatDateString(date: any) {
    const finalDate =
      date.getFullYear() +
      '-' +
      ('0' + (date.getMonth() + 1)).slice(-2) +
      '-' +
      ('0' + (date.getDate() + 1)).slice(-2);
    return finalDate;
  }
}
