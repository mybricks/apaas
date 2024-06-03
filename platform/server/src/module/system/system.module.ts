import { Module } from '@nestjs/common';
import SystemService from './system.service';
import SystemController from './system.controller';

@Module({
  controllers: [SystemController],
  providers: [SystemService],
  exports: [SystemService],
})
export default class SystemModule {}
