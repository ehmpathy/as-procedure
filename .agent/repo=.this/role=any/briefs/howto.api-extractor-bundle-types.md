# howto: bundle types with @microsoft/api-extractor

## .what

use @microsoft/api-extractor to roll up all `.d.ts` files into a single bundled declaration file, with external dependency types inlined for maximum portability.

## .why

- consumers get all types in one file — no need to install transitive dependencies for type chains
- eliminates "the inferred type cannot be named without a reference to X" errors
- produces cleaner, more portable npm packages
- enables api documentation and model generation as bonus features

## .sources

- [api-extractor.json configuration](https://api-extractor.com/pages/configs/api-extractor_json/)
- [configure a .d.ts rollup](https://api-extractor.com/pages/setup/configure_rollup/)
- [invoke api-extractor](https://api-extractor.com/pages/setup/invoking/)

## .how

### install

```sh
npm i -D @microsoft/api-extractor
```

### create config file

run `api-extractor init` or create `api-extractor.json` manually.

**minimal config** (bundles all direct devDependencies):

```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/api-extractor/v7/api-extractor.schema.json",
  "mainEntryPointFilePath": "<projectFolder>/dist/index.d.ts",
  "bundledPackages": ["*"],
  "apiReport": { "enabled": false },
  "docModel": { "enabled": false },
  "dtsRollup": {
    "enabled": true,
    "untrimmedFilePath": "<projectFolder>/dist/index.d.ts"
  }
}
```

**explicit packages config** (for precise control):

```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/api-extractor/v7/api-extractor.schema.json",
  "mainEntryPointFilePath": "<projectFolder>/dist/index.d.ts",
  "bundledPackages": [
    "domain-glossary-procedure",
    "simple-log-methods",
    "serde-fns",
    "type-fns",
    "helpful-errors"
  ],
  "apiReport": { "enabled": false },
  "docModel": { "enabled": false },
  "dtsRollup": {
    "enabled": true,
    "untrimmedFilePath": "<projectFolder>/dist/index.bundled.d.ts"
  }
}
```

### key options

**`mainEntryPointFilePath`**: path to the compiled `.d.ts` entry point (from tsc output)

**`bundledPackages`**: array of package names to inline into the rollup
- types from these packages are embedded directly instead of kept as imports
- supports glob patterns like `"@my-company/*"`
- packages must be declared in `dependencies` or `devDependencies` for globs to match

**`dtsRollup.enabled`**: set to `true` to generate the bundled `.d.ts`

**`dtsRollup.untrimmedFilePath`**: output path for the bundled declaration file

### build flow

```sh
# 1. compile typescript (generates .d.ts files)
tsc -p tsconfig.build.json

# 2. run api-extractor to bundle types
api-extractor run --local --verbose
```

### package.json scripts

```json
{
  "scripts": {
    "build:types": "tsc -p tsconfig.build.json",
    "build:bundle-types": "api-extractor run --local",
    "build": "npm run build:types && npm run build:bundle-types"
  }
}
```

### tsconfig requirements

ensure your `tsconfig.build.json` has:

```json
{
  "compilerOptions": {
    "declaration": true,
    "declarationMap": true,
    "outDir": "dist"
  }
}
```

## .output

api-extractor generates:
- `dist/index.bundled.d.ts` — single file with all types inlined (types from `bundledPackages` included)

## .caveats

- **single entry point**: api-extractor assumes one entry point. for multiple entries, create a barrel file that re-exports all exports
- **glob match**: `bundledPackages` globs only match packages explicitly in package.json `dependencies` or `devDependencies`
- **transitive deps not matched**: the `"*"` glob only matches direct dependencies, not transitive ones. if a bundled package re-exports types from its own dependency, that transitive dependency must also be added to your package.json for it to be bundled
- **tsc first**: api-extractor reads `.d.ts` files — run `tsc` before `api-extractor`

## .integration with tsup

tsup's `experimentalDts: true` uses api-extractor internally but does not expose `bundledPackages`. to bundle external types with tsup:

1. use tsup for js bundle only (`dts: false`)
2. run api-extractor separately with `bundledPackages` configured
3. or accept external type imports (simpler but less portable)
