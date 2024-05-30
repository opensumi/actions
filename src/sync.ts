import { opensumiPackages } from './npm/constants';
import { sync, syncOneVersion } from './npm/registry';

const version = process.argv.slice(2)[0];

if (!version) {
  sync(opensumiPackages);
} else {
  console.log(`start poll version`, version);
  syncOneVersion(opensumiPackages, version);
}
