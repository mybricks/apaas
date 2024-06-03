import { Module } from '@nestjs/common';
import LogSearchController from './log.controller';

@Module({
  controllers: [LogSearchController],
  providers: []
})
export default class LogModule {}
