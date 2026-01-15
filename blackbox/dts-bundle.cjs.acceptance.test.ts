import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, when } from 'test-fns';

import pkg from '../package.json';

describe('dts bundle (cjs)', () => {
  given('the built dist/index.d.cts file', () => {
    const dtsPath = path.join(__dirname, '../dist/index.d.cts');

    when('inspected for forwarded deps', () => {
      (pkg.forwarded ?? []).forEach((dep: string) => {
        then(`should not import from ${dep}`, async () => {
          const dts = await fs.readFile(dtsPath, 'utf-8');
          expect(dts).not.toContain(`from '${dep}'`);
          expect(dts).not.toContain(`from "${dep}"`);
        });
      });

      then('should contain inlined LogMethods interface', async () => {
        const dts = await fs.readFile(dtsPath, 'utf-8');
        expect(dts).toContain('interface LogMethods');
      });

      then('should contain inlined Procedure type', async () => {
        const dts = await fs.readFile(dtsPath, 'utf-8');
        expect(dts).toContain('type Procedure');
      });
    });
  });

  given('the built dist/index.cjs file', () => {
    when('required via cjs', () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const dist = require('../dist/index.cjs');

      then('should export asProcedure', () => {
        expect(dist.asProcedure).toBeDefined();
        expect(typeof dist.asProcedure).toEqual('function');
      });

      then('should export withExpectOutput', () => {
        expect(dist.withExpectOutput).toBeDefined();
        expect(typeof dist.withExpectOutput).toEqual('function');
      });

      then('should export withExpectOutkey', () => {
        expect(dist.withExpectOutkey).toBeDefined();
        expect(typeof dist.withExpectOutkey).toEqual('function');
      });

      then('should export hasName and getName', () => {
        expect(dist.hasName).toBeDefined();
        expect(dist.getName).toBeDefined();
        expect(typeof dist.hasName).toEqual('function');
        expect(typeof dist.getName).toEqual('function');
      });
    });
  });
});
