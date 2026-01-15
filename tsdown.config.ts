import { defineConfig } from 'tsdown';

import pkg from './package.json' with { type: 'json' };

/**
 * .what = tsdown build config with forwarded types bundle
 * .why = inlines re-exported dependency types to solve TS2742 for consumers
 */
export default defineConfig({
  entry: ['src/index.ts'],
  outDir: 'dist',
  format: ['esm', 'cjs'],
  dts: {
    resolver: 'tsc',
  },
  noExternal: pkg.forwarded ?? [],
  clean: true,
});
