import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: false, // use api-extractor for bundled types instead
  splitting: false,
  sourcemap: true,
  clean: true,
  outDir: 'dist',
  tsconfig: 'tsconfig.build.json',
  noExternal: [
    'domain-glossary-procedure',
    'simple-log-methods',
    'serde-fns',
    'type-fns',
    'helpful-errors',
  ],
});
