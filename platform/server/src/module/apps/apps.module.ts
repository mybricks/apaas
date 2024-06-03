
import { Module } from '@nestjs/common';
import AppsService from './apps.service';
import InstallService from './install.service';
import AppsController from './apps.controller';

@Module({
  controllers: [AppsController],
  providers: [AppsService, InstallService]
})
export default class AppModule {}
