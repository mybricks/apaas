import { Controller, Get, Post, Param, Body, Req, Query, Inject } from '@nestjs/common'
import UserFileService from './userFile.service';
import UserService from '../user/user.service';

@Controller("/paas/api/userFile")
export default class UserFileController {
  constructor() {}

  @Inject(UserFileService)
  userFileService: UserFileService;
  @Inject(UserService)
  userService: UserService;

  @Get('/getFileUserInfoByFileIdAndUserId')
  async getFileUserInfoByFileIdAndUserId (@Query('fileId') fileId: number, @Query('userId') userId: string) {
    if (!fileId || !userId) {
      return {
        code: -1,
        msg: '缺少参数 fileId 或 userId'
      }
    }
    const data = await this.userFileService.getFileUserInfoByFileIdAndUserId({ fileId, userId })
    
    return {
      code: 1,
      data,
      msg: 'success'
    }
  }

  @Get('/getUser')
  async getUser(@Query() query) {
    const { email, userId: originUserId, id } = query
    const userId = await this.userService.getCurrentUserId(originUserId || email);
    const data = await this.userFileService.getFileUserInfoByFileIdAndUserId({ fileId: id, userId });
    
    return {
      code: 1,
      data
    }
  }
}