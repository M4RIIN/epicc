import { rmSync } from 'node:fs';

export default function teardown() {
  const path = process.env.EPICC_E2E_DATABASE;
  if (path)
    for (const suffix of ['', '-wal', '-shm'])
      rmSync(`${path}${suffix}`, { force: true });
}
