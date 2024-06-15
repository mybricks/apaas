
import { Module } from '@nestjs/common';
import OpenApiService from './open-api.service';
import OpenApiController from './open-api.controller';

@Module({
  controllers: [OpenApiController],
  providers: [OpenApiService]
})
export default class OpenApiModule {}
