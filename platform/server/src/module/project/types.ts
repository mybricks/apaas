export interface MySqlCreateOption {
  dialect: 'mysql',
  host: string,
  database: string,
  username: string,
  password: string
}

export type CompileTarget = 'prod' | 'staging' | 'debug'

export interface DataBaseConfig { name?: string, version?: string, filePubId: number }

export interface ServiceJson {
  frames?: FxJson[]
}

export interface FxJson {
  id: string,
  title: string,
  inputs: Array<{ id: string, title: string }>,
  outputs: Array<{ id: string, title: string }>,
}

export interface ProjectFrontEndMeta {
  home: string
  appName: string
}

export interface ProjectBackEndMeta {
}

export interface ProjectMeta {
  fileId: string | number,
  version: string,
  frontEnd?: ProjectFrontEndMeta,
  backEnd?: ProjectBackEndMeta,
}