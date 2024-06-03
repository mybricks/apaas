import { Controller, Post, Req, Res } from "@nestjs/common";
import { Response } from 'express';
import * as axios from "axios";

@Controller('/paas/api')
export default class ProxyService {

  @Post('/proxy')
  async proxy(@Req() req, @Res() res: Response) {
    try {
      const body = { ...req.body };
      /** 兼容下载文件，浏览器使用 blob，服务端使用 arraybuffer */
      if (body.responseType?.toLocaleUpperCase() === 'BLOB') {
        body.responseType = 'arraybuffer';
      }

      // @ts-ignore
      const proxyRes = await axios(body);
      res.status(200).send(proxyRes.data).end();
    } catch (e) {
      res.status(200).send({ code: -1, msg: e.message }).end();
    }
  }
}