import { Module } from '@nestjs/common';
import ConfigService from './config.service';
import ConfigController from './config.controller';

@Module({
  controllers: [ConfigController],
  providers: [ConfigService],
  imports: []
})
export default class ConfigModule {}
