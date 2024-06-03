import { Module } from '@nestjs/common';
import OssService from './oss.service';
import FlowService from '../flow/flow.service';
// import FlowModule from '../flow/flow.module';
import OssController from './oss.controller';

@Module({
  controllers: [OssController],
  providers: [],
  imports: []
})
export default class OssModule {}
