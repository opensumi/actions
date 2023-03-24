import { promisify } from 'node:util';
import cp from 'child_process';

const _execAsync = promisify(cp.exec);

export function execAsync(command: string, options?: cp.ExecOptions) {
  return _execAsync(command, options);
}
