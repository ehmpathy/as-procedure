# howto: tsup dual publish esm + cjs with portable types

## .what

use tsup to bundle typescript into both esm and cjs formats with bundled type definitions for maximum npm package portability.

## .why

- consumers may use either esm (`import`) or cjs (`require`)
- bundled `.d.ts` files ensure types work without consumers needing to resolve nested type imports
- proper `exports` field enables node.js module resolution to select the correct format automatically

## .sources

- [dual publishing esm and cjs modules with tsup](https://johnnyreilly.com/dual-publishing-esm-cjs-modules-with-tsup-and-are-the-types-wrong)
- [typescript in 2025 with esm and cjs npm publishing](https://lirantal.com/blog/typescript-in-2025-with-esm-and-cjs-npm-publishing)
- [building an npm package compatible with esm and cjs](https://snyk.io/blog/building-npm-package-compatible-with-esm-and-cjs-2024/)
- [rollup dts file using tsup](https://dev.to/egoist/rollup-dts-file-using-tsup-2579)
- [tsup discussion: bundle external types](https://github.com/egoist/tsup/discussions/989)

## .how

### tsup.config.ts

```ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  outDir: 'dist',
  tsconfig: 'tsconfig.build.json',
});
```

note: `tsconfig` option ensures tsup uses the build-specific tsconfig (which excludes test files).

### bundle external types (for maximum portability)

by default, `dts: true` keeps imports from dependencies as external references. to bundle types from dependencies into the output `.d.ts` file:

**critical limitation**: `--dts-resolve` ignores packages in `dependencies` — they are always externalized. packages must be in `devDependencies` to have their types bundled.

**method 1: `experimentalDts` with api-extractor** (recommended, more reliable)

```ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  experimentalDts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  outDir: 'dist',
  tsconfig: 'tsconfig.build.json',
  noExternal: [
    'my-dep-to-bundle',
    // list all packages to bundle into output
  ],
});
```

requires `@microsoft/api-extractor` as devDependency:
```sh
npm i -D @microsoft/api-extractor
```

**method 2: `dts.resolve`** (simpler, but less reliable for complex type hierarchies)

```ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: { resolve: true },
  splitting: false,
  sourcemap: true,
  clean: true,
  outDir: 'dist',
  tsconfig: 'tsconfig.build.json',
  noExternal: [
    'my-dep-to-bundle',
  ],
});
```

**package.json setup for type bundled packages**:
- packages to bundle must be in `devDependencies` (not `dependencies`)
- use `noExternal` to bundle both js code and types
- consumers will not need to install these packages — everything is bundled

### package.json fields

```json
{
  "type": "module",
  "main": "dist/index.cjs",
  "module": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "import": {
        "types": "dist/index.d.ts",
        "default": "dist/index.js"
      },
      "require": {
        "types": "dist/index.d.cts",
        "default": "dist/index.cjs"
      }
    }
  },
  "files": ["/dist"],
  "sideEffects": false
}
```

### key points

- `"type": "module"` declares the package as esm-first
- `main` points to cjs for legacy consumers
- `module` points to esm for bundlers
- `types` points to esm types as the default
- `exports` field with `types` first in each condition (critical for typescript resolution)
- `sideEffects: false` enables tree-shaking for bundlers

### build command

```json
{
  "build:compile": "tsup"
}
```

### validation (optional, manual)

```sh
npx --yes @arethetypeswrong/cli --pack .
```

this tool checks that:
- type definitions resolve correctly for both esm (`import`) and cjs (`require`) consumers
- the `exports` field maps types to the right module format
- no "false cjs" or "false esm" issues exist (where types claim one format but runtime is another)
- consumers using `moduleResolution: "node16"` or `"bundler"` will get correct types

common issues it catches:
- types pointing to wrong file extension (`.d.ts` for cjs instead of `.d.cts`)
- missing `types` condition in `exports`
- mismatched module formats between types and runtime code

## .output files

tsup generates:
- `dist/index.js` — esm bundle
- `dist/index.cjs` — cjs bundle
- `dist/index.d.ts` — esm type definitions
- `dist/index.d.cts` — cjs type definitions
