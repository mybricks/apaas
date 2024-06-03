
import { Module } from '@nestjs/common';
import ShareService from './share.service';
import ShareController from './share.controller';

@Module({
  controllers: [ShareController],
  providers: [ShareService]
})
export default class ShareModule {}
