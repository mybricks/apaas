import { Body, Controller, Get, Res, Post, Query } from "@nestjs/common";
import FileService from "../file/file.service";
import OnlineUserService from "./online-user.service";
import UserService from "../user/user.service";

@Controller("/paas/api/analyse")
export default class AnalyseController {
  fileService: FileService;
  onlineUserService: OnlineUserService = new OnlineUserService()

  userService: UserService = new UserService()

  constructor() {
    this.fileService = new FileService();
  }

  @Get("/onlineUsers")
  async onlineUsers() {
    try {
      let rtn = await this.onlineUserService.analyseByDay()
      let userInfoMap = {}
      if (Array.isArray(rtn?.activeUsers)) {
        const users = await this.userService.queryByIds({ ids: rtn.activeUsers.map(u => u.userId) })
        users.map(user => {
          userInfoMap[user.id] = {
            name: user.name,
            email: user.email
          }
        })
      }

      rtn = Object.assign(rtn, { userInfoMap })
      
      return {
        code: 1,
        data: rtn,
      };
    } catch (ex) {
      return {
        code: -1,
        message: ex.message,
      };
    }
  }
}
