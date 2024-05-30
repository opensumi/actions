import { request } from 'undici';
import { sleep } from '../utils';

export class Registry {
  constructor(public url: string) {}

  getSyncUrl(pkgName: string) {
    return `${this.url}/${pkgName}/sync?sync_upstream=true`;
  }

  getLogUrl(pkgName: string, logId: string) {
    return `${this.url}/${pkgName}/sync/log/${logId}`;
  }

  async sync(pkgName: string) {
    try {
      const logId = await this.trySync(pkgName);
      if (logId) {
        await this.showLog(pkgName, logId);
      }
    } catch (error) {
      console.log(`${this.url}, sync ${pkgName} error`, error);
    }
  }

  async versionExists(pkgName: string, version: string) {
    const { statusCode } = await request(`${this.url}/${pkgName}/${version}`);
    if (statusCode === 200) {
      return true;
    }
    console.log('pkgName', pkgName, 'statusCode', statusCode, 'in', this.url);
    return false;
  }

  async trySync(pkgName: string) {
    const syncUrl = this.getSyncUrl(pkgName);
    const resp = await request(syncUrl, {
      method: 'PUT',
    });
    if (resp.statusCode === 201) {
      const data = (await resp.body.json()) as any;
      console.log(`get ${pkgName} log id`, data);
      if (data.ok) {
        const logId = data.logId as string;
        return logId;
      } else {
        console.error(`请求 sync url 失败。data: ${data}`);
      }
    } else {
      console.error(`请求 sync url 失败。statusCode: ${resp.statusCode}`);
    }
  }

  async pollLog(
    pkgName: string,
    logId: string,
    offset: number = 0,
    waitForFirstLog = 0,
  ) {
    if (waitForFirstLog > 50) {
      console.log('waitForFirstLog times > 50, return');
      return;
    }
    const logUrl = this.getLogUrl(pkgName, logId);

    const resp = await request(logUrl, {
      query: {
        offset,
      },
    });
    const data = (await resp.body.json()) as any;
    if (data.log) {
      const log = (data.log as string).trim();
      console.log('log:', log);
      const lines = log.split('\n').length;
      if (data.syncDone) {
        return;
      }
      await sleep(500);
      return await this.pollLog(
        pkgName,
        logId,
        offset + lines,
        waitForFirstLog,
      );
    }
    await sleep(500);
    console.log(`pollLog(:${waitForFirstLog}):`, pkgName);
    return await this.pollLog(pkgName, logId, offset, ++waitForFirstLog);
  }

  async showLog(pkgName: string, logId: string) {
    await this.pollLog(pkgName, logId);
    console.log(`sync ${pkgName} done`);
  }
}

export const cnpmRegistry = new Registry('https://r.cnpmjs.org');
export const npmmirrorRegistry = new Registry('https://registry.npmmirror.com');
export const npmRegistry = new Registry('https://registry.npmjs.com');

export async function sync(pkgs: string[]) {
  const toPromise = [] as any[];
  for (const p of pkgs) {
    toPromise.push(
      (async () => {
        console.log(`sync ${p}`);
        await cnpmRegistry.sync(p);
        await npmmirrorRegistry.sync(p);
        console.log(`sync ${p} done`);
      })(),
    );
  }

  await Promise.all(toPromise);
}

export const syncOnePackage = async (
  registry: Registry,
  p: string,
  version: string,
  retryTimes = 0,
) => {
  console.log(`start sync ${p}, retryTimes: ${retryTimes}`);
  if (await registry.versionExists(p, version)) {
    console.log(`${p}@${version} exists`);
    return true;
  }

  if (retryTimes > 20) {
    console.log('stop retry package:', p, 'retryTimes:', retryTimes);
    return false;
  }

  await registry.sync(p);

  console.log(`sync ${p} done`);

  return await syncOnePackage(registry, p, version, retryTimes + 1);
};

export async function syncOneVersion(pkgs: string[], version: string) {
  const toPromise = [] as Promise<void>[];
  for (const p of pkgs) {
    toPromise.push(
      (async () => {
        // 只有当 npm registry 上有这个包再同步。
        if (await npmRegistry.versionExists(p, version)) {
          const result = await syncOnePackage(cnpmRegistry, p, version);
          console.log(`=== sync ${p} cnpm result`, result);
          const result2 = await syncOnePackage(npmmirrorRegistry, p, version);
          console.log(`=== sync ${p} npmmirror result`, result2);
        } else {
          console.error(`=== ${p} ${version} 在 npm 上不存在，请检查。`);
        }
      })(),
    );
  }

  await Promise.all(toPromise);
}
