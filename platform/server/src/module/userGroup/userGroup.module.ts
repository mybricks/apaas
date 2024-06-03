import { Module } from '@nestjs/common';
import UserGroupService from './userGroup.service';
import UserGroupController from './userGroup.controller';
import UserService from '../user/user.service';

@Module({
  controllers: [UserGroupController],
  providers: [UserGroupService, UserService]
})
export default class ShareModule {}
