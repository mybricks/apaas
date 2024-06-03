import { Module } from '@nestjs/common';
import SSOService from './sso.service.ts';
import LoginController from './login.controller';

@Module({
  controllers: [LoginController],
  providers: [SSOService],
  exports: [SSOService],
})
export default class LoginModule {}
