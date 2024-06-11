import { Body, Controller, Get, Res, Post, Query } from "@nestjs/common";
import { Response } from "express";

@Controller("/paas/api/open")
export default class OpenApiController {

  constructor() {}

  @Post("/signup")
  async signUp(@Body('userId') userId: number) {
    try {
      
    } catch (ex) {
      return {
        code: -1,
        message: ex.message,
      };
    }
  }
}
