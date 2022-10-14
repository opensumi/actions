import { kaitianPackages } from './npm/constants';
import { cnpmRegistry, Registry, npmRegistry } from './npm/registry';

const version = process.argv.slice(2)[0];

if (!version) {
  (async () => {
    const toPromise = [] as any[];
    for (const p of kaitianPackages) {
      toPromise.push(
        (async () => {
          console.log(`sync ${p}`);
          await cnpmRegistry.sync(p);
          console.log(`sync ${p} done`);
        })()
      );
    }

    await Promise.all(toPromise);
  })();
} else {
  console.log(`start poll version`, version);

  const syncOnePackage = async (registry: Registry, p, retryTimes = 0) => {
    console.log(`start sync ${p}, retryTimes: ${retryTimes}`);
    if (await registry.versionExists(p, version)) {
      console.log(`${p}@${version} exists`);
      return true;
    }

    if (retryTimes > 5) {
      console.log('stop retry package:', p, 'retryTimes:', retryTimes);
      return false;
    }

    await registry.sync(p);

    console.log(`sync ${p} done`);

    return await syncOnePackage(registry, p, retryTimes + 1);
  };

  (async () => {
    const toPromise = [] as Promise<void>[];
    for (const p of kaitianPackages) {
      toPromise.push(
        (async () => {
          // 只有当 npm registry 上有这个包再同步。
          if (await npmRegistry.versionExists(p, version)) {
            const result = await syncOnePackage(cnpmRegistry, p);
            console.log(`=== sync ${p} result`, result);
          } else {
            console.error(`=== ${p} ${version} 在 npm 上不存在，请检查。`);
          }
        })()
      );
    }

    await Promise.all(toPromise);
  })();
}
