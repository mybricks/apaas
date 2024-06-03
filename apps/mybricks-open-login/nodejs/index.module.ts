import { Module } from '@nestjs/common';
import OpenLoginController from './module/login.controller';

@Module({
  controllers: [OpenLoginController],
  providers: []
})
export default class OpenLoginModule {}
