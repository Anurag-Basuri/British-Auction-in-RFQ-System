import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { RfqService } from './rfq.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateRfqDto } from './dto/rfq.dto';

@Controller('rfq')
@UseGuards(JwtAuthGuard)
export class RfqController {
  constructor(private readonly rfqService: RfqService) {}

  @Post()
  async create(@Request() req: any, @Body() dto: CreateRfqDto) {
    return this.rfqService.create(req.user.sub, dto);
  }

  @Get()
  async findAll() {
    return this.rfqService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.rfqService.findOne(+id);
  }
}
