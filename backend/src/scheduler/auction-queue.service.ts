import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';

@Injectable()
export class AuctionQueueService {
  constructor(@InjectQueue('auction') private auctionQueue: Queue) {}

  async scheduleClosure(rfqId: number, closeTime: Date) {
    const delay = closeTime.getTime() - Date.now();
    
    // Remove existing jobs for this RFQ to avoid duplicate closures.
    await this.auctionQueue.remove(rfqId.toString());

    // Schedule new closure job.
    await this.auctionQueue.add(
      'close-auction',
      { rfqId },
      { 
        jobId: rfqId.toString(),
        delay: delay > 0 ? delay : 0, 
      }
    );
  }
}
