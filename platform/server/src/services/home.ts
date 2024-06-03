import { Body, Controller, Get, Post, Req, Request, Res } from '@nestjs/common';
import AppService from '../module/apps/apps.service';

@Controller()
export default class HomeService {
  appService: AppService;

  constructor() {
    this.appService = new AppService()
  }

  @Get('/')
  async getInstalledList(@Req() req: Request, @Res() res) {
    const apps: any = await this.appService.getAllInstalledList({ filterSystemApp: false })
    let redirectUrl = null;
    apps?.forEach(app => {
      const loginPage = app.exports.find(p => p.name === 'login') // mybricks声明里提供了 login serviceProvider 的为登录页面 
      if (loginPage) {
        redirectUrl = loginPage.path;
      }
    });

    if (redirectUrl) {
      res.redirect?.(`${redirectUrl}${req.url.slice(1, req.url.length) ?? ''}`);
    } else {
      res.send(`未配置首页请前往: ${req.hostname}/workspace.html`);
    }
  }
}
