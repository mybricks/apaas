import * as path from 'path'
import * as fse from 'fs-extra'

import env from './env';

const getProjectsFromEnvPath = async (dir: string) => {
  if (!await fse.pathExists(dir)) {
    return []
  }

  let results = []

  const scopeIds = await fse.readdir(dir);

  for (let index = 0; index < scopeIds.length; index++) {
    const scopeId = scopeIds[index];
    
    if (fse.pathExists(path.resolve(dir, scopeId, 'front_end', 'index.html'))) {
      results.push(`/${scopeId}/index`)
    }
  }

  return results
}

export const getExistedProjects = async (prefix = '') => {
  let results = []

  let stagingResults = await getProjectsFromEnvPath(env.APP_PROJECT_STAGING_PATH)
  stagingResults = stagingResults.map(url => `${prefix}/preview${url}`)

  results = results.concat(stagingResults)

  let prodResults = await getProjectsFromEnvPath(env.APP_PROJECT_PROD_PATH)
  prodResults = prodResults.map(url => `${prefix}/app${url}`)

  results = results.concat(prodResults)

  return results
}

