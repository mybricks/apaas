import { Request, Response, NextFunction } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { safeDecodeURIComponent, safeEncodeURIComponent } from '../utils';
import env from '../utils/env'


export const assetAdapterMiddleware = (namespaces: string[]) => (req: Request, res: Response, next: NextFunction) => {
  if (global.IS_PURE_INTRANET && (req.path.includes('.html') || safeDecodeURIComponent(req.path).includes('.html'))) {
    const app = namespaces.find(name => req.path.startsWith(`/${name}`) || req.path.startsWith(safeEncodeURIComponent(`/${name}`)));

    let hasOffline;
    if (app) {
      const encodeNamespace = safeEncodeURIComponent(`/${app}`);
      hasOffline = fs.existsSync(
        path.join(
          env.getAppInstallFolder(),
          req.path.replace(encodeNamespace, `${encodeNamespace}/assets`)
            .replace(`/${app}`, `/${app}/assets`)
            .replace('.html', '.offline.html')
        )
      );
    } else {
      hasOffline = fs.existsSync(path.join(process.cwd(), '_assets', req.path.replace('.html', '.offline.html')));
    }

    if (hasOffline) {
      req.url = req.url.replace('.html', '.offline.html');
    }
  } else {

  }

  next();
}