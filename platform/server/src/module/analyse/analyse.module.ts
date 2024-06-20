
import { Module } from '@nestjs/common';
import AnalyseService from './analyse.service';
import AnalyseController from './analyse.controller';

@Module({
  controllers: [AnalyseController],
  providers: [AnalyseService]
})
export default class AnalyseModule {}
