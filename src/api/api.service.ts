import { HttpService } from '@nestjs/axios';
import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { catchError, firstValueFrom, map } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';
import { GetLastRateDto } from './dto/get-last-rate.dto';

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

              const has_changed = await this.prisma.rate.findFirst({
                where: { date: new Date(date), cost, sale },
              });
              if (!has_changed) {
                await this.prisma.rate.create({
                  data: { date: new Date(date), cost, sale },
                });
              }

              return { date: this.formatDate(date), cost, sale };
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
      return {
        date: this.formatDate(rate[0].date),
        cost: rate[0].cost,
        sale: rate[0].sale,
      };
    } catch (error) {
      throw new Error(error);
    }
  }

  formatDate(val: any) {
    const date = new Date(val);
    const finalDate =
      date.getFullYear() +
      '-' +
      ('0' + (date.getMonth() + 1)).slice(-2) +
      '-' +
      ('0' + date.getDate()).slice(-2);
    return finalDate;
  }
}
