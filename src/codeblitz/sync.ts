import { codeBlitzPackages } from '../npm/constants';
import { cnpmRegistry, Registry, npmRegistry, npmmirrorRegistry } from '../npm/registry';

const version = process.argv.slice(2)[0];

if (!version) {
  (async () => {
    const toPromise = [] as any[];
    for (const p of codeBlitzPackages) {
      toPromise.push(
        (async () => {
          console.log(`sync ${p}`);
          await cnpmRegistry.sync(p);
          await npmmirrorRegistry.sync(p);
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

    if (retryTimes > 20) {
      console.log('stop retry package:', p, 'retryTimes:', retryTimes);
      return false;
    }

    await registry.sync(p);

    console.log(`sync ${p} done`);

    return await syncOnePackage(registry, p, retryTimes + 1);
  };

  (async () => {
    const toPromise = [] as Promise<void>[];
    for (const p of codeBlitzPackages) {
      toPromise.push(
        (async () => {
          // 只有当 npm registry 上有这个包再同步。
          if (await npmRegistry.versionExists(p, version)) {
            const result = await syncOnePackage(cnpmRegistry, p);
            console.log(`=== sync ${p} cnpm result`, result);
            const result2 = await syncOnePackage(npmmirrorRegistry, p);
            console.log(`=== sync ${p} npmmirror result`, result2);
          } else {
            console.error(`=== ${p} ${version} 在 npm 上不存在，请检查。`);
          }
        })()
      );
    }

    await Promise.all(toPromise);
  })();
}
