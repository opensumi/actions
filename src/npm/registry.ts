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
      const data = await resp.body.json();
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
    waitForFirstLog = 0
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
    const data = await resp.body.json();
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
        waitForFirstLog
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
