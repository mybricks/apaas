import { Module } from '@nestjs/common';
import MaterialService from './material.service';
import MaterialController from './material.controller';
import MaterialDao from './material.dao';

@Module({
	imports: [],
	controllers: [MaterialController],
	providers: [MaterialService, MaterialDao],
	exports: [],
})
export default class MaterialModule {}
