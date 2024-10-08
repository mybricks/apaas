import {
  Get,
  Controller,
  Body,
  Post,
  Param,
  Headers,
  Query,
  Request,
} from '@nestjs/common';
import FileDao from '../../dao/FileDao';
import UserDao from '../../dao/UserDao';
import { Logs, uuidOfNumber } from '../../utils';
import UserService from './user.service';
import { Logger } from '@mybricks/rocker-commons';
import { USER_ROLE } from '../../constants'

@Controller('/paas/api/user')
export default class UserController {
  fileDao: FileDao;
  userDao: UserDao;
  userService: UserService;

  constructor() {
    this.fileDao = new FileDao();
    this.userDao = new UserDao();
    this.userService = new UserService();
  }

  @Get('/getAll')
  async getAll() {
    const userAry = await this.userDao.queryAll();
    if (userAry) {
      return {
        code: 1,
        data: userAry.map((user) => {
          return {
            id: user.id,
            email: user.email,
            licenseCode: user.licenseCode,
            createTime: user.createTime,
          };
        }),
      };
    } else {
      return {
        code: 1,
        data: null,
      };
    }
  }

  @Post('/searchByKeyword')
  async searchByKeyword(@Body() body: {keyword: string}) {
    const { keyword } = body
    if (keyword) {
      const list: any = await this.userDao.searchByKeyword({ keyword });

      return {
        code: 1,
        data: list?.map((user) => {
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
          }
        }),
      };
    } else {
      return { code: 1, data: [] };
    }
  }

  @Get('/queryBy')
  async queryBy(@Query() query) {
    if (query.email) {
      const user = await this.userDao.queryByEmail({ email: query.email });

      if (user) {
        return {
          code: 1,
          data: [
            {
              id: user.id,
              email: user.email,
              name: user.name,
              avatar: user.avatar,
              isAdmin: user.role === USER_ROLE.ADMIN,
              createTime: user.createTime,
            },
          ],
        };
      } else {
        return { code: 1, data: null };
      }
    } else {
      return { code: -1, msg: 'email is null' };
    }
  }

  @Post('/addUser')
  async addUser(@Body() body) {
    const { email, name, avatar } = body;
    const user = await this.userDao.queryByEmail({ email });
    if (user) {
      Logs.info(`邮箱${email}已被注册.`);

      return {
        code: -1,
        msg: `邮箱${email}已被注册.`,
      };
    } else {
      const { id } = await this.userDao.create({
        email,
        name,
        avatar
      });

      Logs.info(`新用户${email}注册完成.`);

      return {
        code: 1,
        data: {
          userId: id,
        },
      };
    }
  }

  @Post('/queryByRoleAndName')
  async queryByRoleAndName(
    @Body('role') role: number, 
    @Body('email') email: string, 
    @Body('page') page: number, 
    @Body('pageSize') pageSize: number
  ) {
    const param = {
      role,
      email,
      page,
      pageSize
    }
    const [list, total] = await Promise.all([
      this.userService.queryByRoleAndName(param),
      this.userService.getTotalCountByParam({ role, email })
    ])
    return {
      code: 1,
      data: {
        list, 
        pagination: {
          page,
          pageSize,
        },
        total
      }
    }
  }

  @Post('/setUserRole')
  async setUserRole(
    @Body('userId') userId: string,
    @Body('role') role: number,
    @Body('updatorId') updatorId: string
  ) {
    if(!userId || !role || !updatorId) {
      return {
        code: -1,
        msg: '参数缺失'
      }
    }
    const user = await this.userDao.queryById({ id: updatorId })
    if(user.role === USER_ROLE.ADMIN) {
      await this.userService.setUserRole({userId: userId, role})
      return {
        code: 1,
        msg: '设置成功'
      }
    } else {
      return {
        code: -1,
        msg: '暂无权限操作'
      }
    }
  }

  @Post('/setUserInfo')
  async setUserInfo(
    @Body('userId') userId: number,
    @Body('name') name: string
  ) {
    if(!name || !userId) {
      return {
        code: -1,
        msg: '参数缺失'
      }
    }

    const ret = await this.userService.queryByName({ name })
    if (ret && ret.id != userId) {
      return {
        code: -1,
        msg: '用户名已存在'
      }
    }

    await this.userService.setUserInfo({userId, name})
    return {
      code: 1,
      msg: '设置成功'
    }
  }
}
