# tsdown: dts bundle for external dependencies

## .what

tsdown is a library bundler built on rolldown (rust-based rollup successor) that can bundle external type definitions into a single portable `.d.ts` file, which solves the TS2742 transitive dependency problem.

---

## the problem: TS2742

### what is TS2742?

> "The inferred type of 'X' cannot be named without a reference to 'Y'. This is likely not portable. A type annotation is necessary."

this error occurs when:
- types are re-exported across package boundaries
- typescript's symlink discovery fails to find transitive dependencies
- pnpm's isolated node_modules structure prevents type resolution

### why it happens

```
simple-log-methods -> as-procedure -> rhachet -> rhachet-roles-brain
                                                  ↓
                                          TS2742 error!
```

the consumer (`rhachet-roles-brain`) can't resolve types from `simple-log-methods` because:
1. it's not in their direct dependencies
2. pnpm doesn't hoist transitive deps
3. typescript's heuristic symlink discovery fails

### status

- reported in 2019 ([TypeScript#30858](https://github.com/microsoft/TypeScript/issues/30858))
- still "Needs Investigation" as of 2026
- affects pnpm, yarn pnp, and monorepo setups

---

## .why use tsdown

| feature | tsdown | tsup | api-extractor | dts-bundle-generator |
|---------|--------|------|---------------|---------------------|
| speed | fastest (rolldown + oxc) | fast (esbuild) | slow | slow |
| dts bundle | native | `--dts-resolve` | native | native |
| isolatedDeclarations | native oxc support | no | no | no |
| config | zero-config | zero-config | complex | minimal |
| maintenance | active (vite ecosystem) | active | active | maintenance mode |
| declaration maps | partial | partial | partial | no |

**key advantage**: with `isolatedDeclarations` enabled, tsdown uses oxc-transform which is **40x faster** than tsc on typical files.

### real-world adoption

- **vue.js**: experiments with oxc-transform for isolated declarations
- **airtable**: integrates oxc isolated declarations in their bazel ci pipeline
- **@sxzz**: reports .d.ts generation dropped from 76s to 16s

---

## installation

```bash
npm install -D tsdown
```

---

## basic usage

```bash
# generate bundled .d.ts
tsdown src/index.ts --dts

# with output directory
tsdown src/index.ts --dts -d dist
```

---

## configuration

### tsdown.config.ts

```typescript
import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  outDir: 'dist',
  dts: true, // or detailed config below
})
```

---

## dts.resolve: bundle external types

by default, tsdown **does not bundle** any dependency types. to inline external types:

### resolve specific packages

```typescript
export default defineConfig({
  dts: {
    resolve: ['simple-log-methods', 'some-other-package'],
  },
})
```

### resolve by pattern (regex)

```typescript
export default defineConfig({
  dts: {
    resolve: [/^@types\//, /^my-internal-/],
  },
})
```

### resolve all external types

```typescript
export default defineConfig({
  dts: {
    resolve: true,
    resolver: 'tsc', // recommended when resolve: true
  },
})
```

---

## dts.resolver: oxc vs tsc

| resolver | speed | compatibility |
|----------|-------|---------------|
| `'oxc'` (default) | faster | may fail on complex setups |
| `'tsc'` | slower | handles edge cases |

### when to use tsc resolver

- `@types/` packages with unusual paths (e.g., `@types/babel__generator`)
- complex type re-exports from deep node_modules
- when oxc fails to resolve types correctly

```typescript
export default defineConfig({
  dts: {
    resolve: true,
    resolver: 'tsc',
  },
})
```

---

## isolatedDeclarations: fast mode

when `isolatedDeclarations: true` in tsconfig.json, tsdown uses **oxc-transform** instead of tsc:

### enable in tsconfig.json

```json
{
  "compilerOptions": {
    "isolatedDeclarations": true,
    "declaration": true
  }
}
```

### performance gains

- **40x faster** than tsc on typical files
- **20x faster** on larger files
- real-world: 76s → 16s (reported by @sxzz)

### requirement

all exported functions must have **explicit return types**:

```typescript
// ❌ fails with isolatedDeclarations
export const createThing = () => new Thing();

// ✅ works with isolatedDeclarations
export const createThing = (): Thing => new Thing();
```

---

## dependency behavior

### default behavior

| dependency type | bundled? |
|-----------------|----------|
| `dependencies` | no (external) |
| `peerDependencies` | no (external) |
| `devDependencies` | only if imported |
| phantom (unlisted) | only if imported |

### force bundle a package

```typescript
export default defineConfig({
  noExternal: ['some-package'],
})
```

### force externalize a package

```typescript
export default defineConfig({
  external: ['lodash', /^@my-scope\//],
})
```

---

## tradeoffs

### declaration maps are lost

when types are bundled, `.d.ts.map` files are **not rolled up**. this means:
- "go to definition" navigates to the bundled `.d.ts` file
- you lose navigation to original source of inlined types
- this is a known limitation across all dts bundle tools

feature request: [microsoft/rushstack#1886](https://github.com/microsoft/rushstack/issues/1886)

### package size increase is marginal

> "Marginal bundle size increase only (negligible after compilation)"

type declaration files are text-only and compress well. consumers already need these types in their node_modules anyway — bundled types just consolidate them.

### bundled types reduce conflicts

bundled types actually **reduce** type conflict risk:
1. the type is inlined and no longer depends on external resolution
2. consumers don't need the transitive dependency installed
3. version mismatch between publisher and consumer is eliminated

conflicts occur when **external** types have multiple versions in node_modules. bundled types sidestep this entirely.

---

## complete example: solve TS2742

for a package like `as-procedure` that exposes types from `simple-log-methods`:

### tsdown.config.ts

```typescript
import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  outDir: 'dist',
  format: ['esm', 'cjs'],
  dts: {
    resolve: ['simple-log-methods'], // inline this transitive dep's types
  },
})
```

### package.json

```json
{
  "scripts": {
    "build": "tsdown"
  },
  "main": "dist/index.cjs",
  "module": "dist/index.js",
  "types": "dist/index.d.ts"
}
```

### result

before bundle:
```typescript
// dist/index.d.ts
import { LogMethods } from 'simple-log-methods';
export interface Context { log: LogMethods; }
```

after bundle with `resolve: ['simple-log-methods']`:
```typescript
// dist/index.d.ts
interface LogMethods { /* inlined */ }
export interface Context { log: LogMethods; }
```

consumers no longer need `simple-log-methods` resolvable in their node_modules.

---

## under the hood

tsdown uses [rolldown-plugin-dts](https://github.com/sxzz/rolldown-plugin-dts) internally:

1. **generation**: uses oxc-transform (fast) or tsc (compatible) to emit `.d.ts`
2. **bundle**: rolldown bundles multiple `.d.ts` files into one
3. **resolution**: oxc-resolver or tsc resolves external type paths
4. **inline**: matched `resolve` patterns get their types copied inline

---

## cli reference

```bash
tsdown [entry] [options]

options:
  --dts              generate declaration files
  --dts.resolve      resolve external types (comma-separated)
  -d, --outDir       output directory
  --format           output format (esm, cjs, iife)
  --external         external packages (comma-separated)
  --noExternal       force bundle packages (comma-separated)
```

---

## alternative tools comparison

### api-extractor
- ✅ powerful dts rollup with visibility tags
- ❌ complex configuration
- ❌ single entrypoint only
- ❌ no declaration map rollup

### dts-bundle-generator
- ✅ zero-config, lightweight
- ❌ in maintenance mode
- ❌ no declaration map support
- ❌ limited external package bundle

### tsup --dts-resolve
- ✅ simple, widely used
- ❌ ignores packages in `dependencies` (always external)
- ❌ experimental dts support
- ❌ slower than tsdown

### rollup-plugin-dts
- ✅ rollup integration
- ❌ in maintenance mode
- ❌ no declaration map support
- ❌ bundle of external @types not recommended

---

## sources

- [tsdown documentation](https://tsdown.dev/guide/)
- [tsdown dts options](https://tsdown.dev/options/dts)
- [tsdown dependencies options](https://tsdown.dev/options/dependencies)
- [rolldown-plugin-dts](https://github.com/sxzz/rolldown-plugin-dts)
- [github - rolldown/tsdown](https://github.com/rolldown/tsdown)
- [alan norbauer - switch from tsup to tsdown](https://alan.norbauer.com/articles/tsdown-bundler/)
- [oxc transformer alpha](https://oxc.rs/blog/2024-09-29-transformer-alpha)
- [microsoft/TypeScript#30858](https://github.com/microsoft/TypeScript/issues/30858) - TS2742 original issue
- [microsoft/TypeScript#42873](https://github.com/microsoft/TypeScript/issues/42873) - TS2742 type portability
- [dts-bundle-generator discussion #68](https://github.com/timocov/dts-bundle-generator/discussions/68) - tools comparison
- [microsoft/rushstack#1886](https://github.com/microsoft/rushstack/issues/1886) - declaration map rollup request
