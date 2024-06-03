import {
  MiddlewareConsumer,
  CacheModule,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import UserFileController from './userFile.controller';
import UserFileService from './userFile.service';
import UserService from '../user/user.service';

@Module({
  controllers: [UserFileController],
  providers: [UserFileService, UserService],
})
export default class UserFileModule {}
