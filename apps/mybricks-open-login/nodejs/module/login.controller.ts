import {
  Req,
  Post,
  Res,
  Get,
  Body,
  HttpCode,
  Query,
} from "@nestjs/common";
import { Logger } from '@mybricks/rocker-commons';
import Decorator from "@mybricks/sdk-for-app/decorator";
import OpenLoginService from "./login.service";


@Decorator.Controller("api/login", {
  namespace: 'mybricks-open-login',
})
export default class OpenLoginController {
  
  openLoginService = new OpenLoginService()

  constructor() {
  }

  @Get('/healthy')
  async healthy() {
    return 'ok'
  }
}

