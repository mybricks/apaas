import { Module, OnModuleInit } from "@nestjs/common";
import * as path from 'path';

import HealthModule from './module/health/health.module'
import RuntimeModule from "./module/runtime/runtime.module";


@Module({
  imports: [
    HealthModule,
    RuntimeModule,
  ],
  controllers: [
  ],
  providers: [
  ],
})
export class AppModule {}