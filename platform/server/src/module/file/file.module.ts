import { Module } from '@nestjs/common';
import FileService from './file.service';
import FileController from './file.controller';
import FileContentController from './file-content.controller';

@Module({
  controllers: [FileController, FileContentController],
  providers: [FileService],
  exports: [FileService],
})
export default class FileModule {}
