import { Body, Controller, Get, Res, Post, Query } from "@nestjs/common";
import { Response } from "express";
import FileService from "../file/file.service";

@Controller("/paas/api/share")
export default class ShareController {
  fileService: FileService;

  constructor() {
    this.fileService = new FileService();
  }

  @Post("/getAll")
  async getAll(@Body('pageSize') pageSize: number, @Body('page') page: number, @Body('extName') extName: string, @Body('onlyPublished') onlyPublished) {
    try {
      const rtn = await this.fileService.getAllShareFiles({
        pageSize,
        page,
        extName,
        onlyPublished
      });
      const total = await this.fileService.getCountOfShareFiles(extName, onlyPublished)
      return {
        code: 1,
        data: {
          list: rtn?.filter ? rtn.filter((item) => {
            // 不需要hasIcon字段了，全部是文件了，不是base64
            // 不需要hasIcon字段了，全部是文件了，不是base64
            // const { hasIcon } = item
            // if (hasIcon === "1") {
            //   item.icon = `/paas/api/workspace/getFileIcon?fileId=${item.id}`;
            // } else if (hasIcon.startsWith('http')) {
            //   item.icon = hasIcon
            // }
            return item.extName !== "component";
          }) : [],
          total
        },
      };
    } catch (ex) {
      return {
        code: -1,
        message: ex.message,
      };
    }
  }

  // @Get("/getFileIcon")
  // async getFileIcon(@Query() query, @Res() res: Response) {
  //   try {
  //     const file = await this.fileDao.queryIconById(query.fileId);
  //     const base64 = file.icon.replace(/^data:image\/\w+;base64,/, "");
  //     const dataBuffer = new Buffer(base64, "base64");

  //     res.end(dataBuffer);
  //   } catch (ex) {
  //     res.end(ex.message);
  //   }
  // }
}
