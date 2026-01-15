import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, when } from 'test-fns';

import pkg from '../package.json';

describe('dts bundle (esm)', () => {
  given('the built dist/index.d.mts file', () => {
    const dtsPath = path.join(__dirname, '../dist/index.d.mts');

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

  given('the built dist/index.mjs file', () => {
    when('imported via esm', () => {
      then('should export asProcedure', async () => {
        const dist = await import('../dist/index.mjs');
        expect(dist.asProcedure).toBeDefined();
        expect(typeof dist.asProcedure).toEqual('function');
      });

      then('should export withExpectOutput', async () => {
        const dist = await import('../dist/index.mjs');
        expect(dist.withExpectOutput).toBeDefined();
        expect(typeof dist.withExpectOutput).toEqual('function');
      });

      then('should export withExpectOutkey', async () => {
        const dist = await import('../dist/index.mjs');
        expect(dist.withExpectOutkey).toBeDefined();
        expect(typeof dist.withExpectOutkey).toEqual('function');
      });

      then('should export hasName and getName', async () => {
        const dist = await import('../dist/index.mjs');
        expect(dist.hasName).toBeDefined();
        expect(dist.getName).toBeDefined();
        expect(typeof dist.hasName).toEqual('function');
        expect(typeof dist.getName).toEqual('function');
      });
    });
  });
});
