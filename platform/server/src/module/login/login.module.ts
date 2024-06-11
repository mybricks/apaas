import { Module } from '@nestjs/common';
import LoginController from './login.controller';

@Module({
  controllers: [LoginController],
  providers: [],
  exports: [],
})
export default class LoginModule {}
