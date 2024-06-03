

import axios from 'axios';

enum OssPlatform {
  Ali = 'Ali'
}

interface OssConfig {
  region: string,
  accessKeyId: string,
  accessKeySecret: string,
}

class OSS {
  type = OssPlatform.Ali

  config: OssConfig

  constructor(config: OssConfig, ) {
    this.config = config
  }

  PutObject = ({ content, folderPath, filename }) => {}
}