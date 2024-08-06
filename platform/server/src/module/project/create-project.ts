import * as fse from 'fs-extra';
import * as path from 'path'

import { MySqlCreateOption, ProjectMeta, ServiceJson } from './types'


export async function ensureProject(folderPath, folderName, metaInfo: ProjectMeta) {
  const projectFolderPath = path.join(folderPath, folderName);
  await fse.ensureDir(projectFolderPath);
  
  const projectMetaFilePath = path.resolve(projectFolderPath, 'meta.json');

  const frontEndFolderPath = path.resolve(projectFolderPath, 'front_end');
  const backEndFolderPath = path.resolve(projectFolderPath, 'back_end');

  await fse.ensureDir(frontEndFolderPath);
  await fse.ensureDir(backEndFolderPath);

  // 写入 meta 信息
  if (typeof metaInfo === 'object') {
    if (!await fse.pathExists(projectMetaFilePath)) {
      await fse.writeJSON(projectMetaFilePath, metaInfo, 'utf-8')
    } else {
      const oldInfo = await fse.readJSONSync(projectMetaFilePath, 'utf-8');
      await fse.writeJSON(projectMetaFilePath, Object.assign(oldInfo, metaInfo), 'utf-8')
    }
  }

  return {
    projectFolderPath,
    projectMetaFilePath,
    frontEndFolderPath,
    backEndFolderPath,
  }
}

interface FrontEndFile {
  fileName: string,
  folderPath: string,
  content: string
}

export async function createProjectFrontEnd(folderName, folderPath, {
  metaInfo,
  files
} : {
  metaInfo: ProjectMeta,
  files: FrontEndFile[]
}) {
  const { frontEndFolderPath, projectMetaFilePath, projectFolderPath } = await ensureProject(folderPath, folderName, metaInfo);

  const results = files.map(async file => {
    const targetFolderPath = path.join(frontEndFolderPath, file.folderPath);
    await fse.ensureDir(targetFolderPath);
    const targetFilePath = path.join(targetFolderPath, file.fileName)
    return fse.writeFile(targetFilePath, file.content, 'utf-8');
  })

  await Promise.all(results);

  return {
    projectPath: projectFolderPath,
  }
}

export async function createProjectService(folderName, folderPath, {
  metaInfo,
  database,
  toJson,
  coms
}: {
  metaInfo: ProjectMeta,
  database: MySqlCreateOption
  toJson: ServiceJson,
  coms?: any[]
}) {
  const { backEndFolderPath, projectMetaFilePath, projectFolderPath } = await ensureProject(folderPath, folderName, metaInfo);

  const targetFolder = path.join(folderPath, folderName);

  await fse.ensureDir(targetFolder);

  const projectToJsonPath = path.resolve(backEndFolderPath, 'project.json');
  const componentsMapFilePath = path.resolve(backEndFolderPath, 'rtComs.js');

  // 写入 服务端 Json
  await fse.writeJSON(projectToJsonPath, Object.assign(toJson, { database }), 'utf-8');

  // 写入 组件代码
  await fse.writeFile(componentsMapFilePath, '', 'utf-8');

  return {
    projectPath: projectFolderPath,
  }
}