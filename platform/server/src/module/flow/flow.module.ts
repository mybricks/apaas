import { Module } from '@nestjs/common';
import FlowService from './flow.service';
import FlowController from './flow.controller';

@Module({
  controllers: [FlowController],
  providers: [FlowService]
})
export default class FlowModule {}
