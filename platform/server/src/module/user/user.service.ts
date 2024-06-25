import { Logger } from '@mybricks/rocker-commons';
import { Inject, Injectable } from '@nestjs/common';
import UserDao from '../../dao/UserDao';

@Injectable()
export default class UserService {
  userDao: UserDao;

  constructor() {
    this.userDao = new UserDao();
  }


  async queryByRoleAndName(param) {
    return await this.userDao.queryByRoleAndName(param);
  }

  async getTotalCountByParam({ role, email }) {
    return await this.userDao.getTotalCountByParam({ role, email });
  }

  async setUserRole({ role, userId }) {
    return await this.userDao.setUserRole({userId,role});
  }

  async setUserInfo({userId, name}) {
    return await this.userDao.setUserInfo({userId, name});
  }

  async queryByEmail({ email }) {
    return await this.userDao.queryByEmail({email});
  }

  async queryByName({ name }) {
    return await this.userDao.queryByName({name});
  }

  async queryById({ id }) {
    return await this.userDao.queryById({ id });
  }

  async queryByIds({ ids }) {
    return await this.userDao.queryByIds({ ids })
  }


  /** 获取用户 ID，传的是字符串则查找用户，数字则直接返回 */
  async getCurrentUserId(userId: any) {
    // email中存储其他唯一键：真正的邮箱或者其他唯一的key
    // @ts-ignore
    if (userId && typeof userId !== 'number' && (userId.includes('@') || Number(userId) != userId)) {
      const user = await this.queryByEmail({ email: userId });

      return user?.id;
    }
    return userId;
  }
}
