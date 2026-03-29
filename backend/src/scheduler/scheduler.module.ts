import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AuctionQueueService } from './auction-queue.service';
import { AuctionProcessor } from './auction.processor';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    PrismaModule,
    NotificationsModule,
    BullModule.registerQueue({
      name: 'auction',
    }),
  ],
  providers: [AuctionQueueService, AuctionProcessor],
  exports: [AuctionQueueService],
})
export class SchedulerModule {}
