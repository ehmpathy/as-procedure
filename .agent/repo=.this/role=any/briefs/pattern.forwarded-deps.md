# pattern: forwarded deps

## .what

**forwarded deps** = dependencies whose types are re-exported from your package's public api.

when you write:

```ts
// src/index.ts
export * from 'simple-log-methods';
export * from 'domain-glossary-procedure';
```

you have forwarded those dependencies' types to your consumers.

---

## .why forward deps

this pattern is useful when:

1. **convenience** — consumers get types from one import instead of multiple
2. **abstraction** — your package wraps/extends another package's types
3. **composition** — your types compose types from dependencies

```ts
// consumer gets LogMethods from as-procedure, not from simple-log-methods
import { asProcedure, type LogMethods } from 'as-procedure';
```

---

## .problem: TS2742 transitive dependency errors

### what happens

when consumers of your package try to re-export your types, typescript fails:

```
error TS2742: The inferred type of 'SKILL_ARTICULATE' cannot be named
without a reference to '.pnpm/simple-log-methods@0.6.9/node_modules/simple-log-methods'.
This is likely not portable. A type annotation is necessary.
```

### why it happens

```
simple-log-methods -> as-procedure -> rhachet -> rhachet-roles-brain
                                                  ↓
                                          TS2742 error!
```

the consumer (`rhachet-roles-brain`) can't resolve types from `simple-log-methods` because:

1. **not a direct dependency** — `simple-log-methods` isn't in their `package.json`
2. **pnpm isolation** — pnpm doesn't hoist transitive deps
3. **typescript heuristics fail** — symlink discovery is heuristic-based and breaks

### the core issue

your `.d.ts` output contains:

```ts
// dist/index.d.ts (before bundle)
import { LogMethods } from 'simple-log-methods';  // ← external reference
export interface Context { log: LogMethods; }
```

consumers must have `simple-log-methods` resolvable — but they don't.

---

## .solution: bundle forwarded types via tsdown

### how it works

tsdown with `dts.resolve` inlines the forwarded types into your `.d.ts`:

```ts
// dist/index.d.ts (after bundle)
interface LogMethods { /* inlined from simple-log-methods */ }
export interface Context { log: LogMethods; }
```

consumers no longer need `simple-log-methods` resolvable.

### the pattern

#### 1. declare forwarded deps in package.json

```json
{
  "name": "as-procedure",
  "dependencies": {
    "simple-log-methods": "0.6.9",
    "domain-glossary-procedure": "1.0.0"
  },
  "forwarded": [
    "simple-log-methods",
    "domain-glossary-procedure"
  ]
}
```

maintainers manage `forwarded` like they manage `dependencies`.

#### 2. tsdown.config.ts reads from forwarded

```ts
import { defineConfig } from 'tsdown';
import pkg from './package.json';

export default defineConfig({
  entry: ['src/index.ts'],
  outDir: 'dist',
  format: ['esm'],
  dts: {
    resolve: pkg.forwarded ?? [],
    resolver: 'tsc',
  },
  clean: true,
});
```

#### 3. build produces bundled types

```sh
npm run build  # runs tsdown
```

output `dist/index.d.ts` has all forwarded types inlined.

---

## .what qualifies as forwarded

| pattern                                   | forwarded? | reason                           |
| ----------------------------------------- | ---------- | -------------------------------- |
| `export * from 'pkg'`                     | ✅ yes      | all types exposed                |
| `export { Type } from 'pkg'`              | ✅ yes      | specific types exposed           |
| `export type { Type } from 'pkg'`         | ✅ yes      | type-only re-export              |
| `import { fn } from 'pkg'` (internal use) | ❌ no       | not in public api                |
| types in function signatures from deps    | ⚠️ maybe    | if consumers must reference them |

### rule of thumb

if consumers import a type that originates from your dependency, that dependency is forwarded.

---

## .tradeoffs

### declaration maps are lost

bundled types don't preserve `.d.ts.map` files:
- "go to definition" navigates to bundled `.d.ts` instead of original source
- this is a known limitation across all dts bundle tools

**verdict**: portability gain outweighs this limitation.

### marginal size increase

bundled types add text to your package:
- type declarations compress well
- consumers need these types anyway — bundle just consolidates

**verdict**: negligible impact.

---

## .verification

### acceptance test

create: `src/blackbox/dts-bundle.acceptance.test.ts`

blackbox tests run against `dist/` output — the only scope appropriate to verify bundled types.

```ts
import { given, when, then } from 'test-fns';
import * as fs from 'fs/promises';
import * as path from 'path';
import pkg from '../../package.json';

describe('dts bundle', () => {
  given('the built dist/index.d.ts', () => {
    const dtsPath = path.join(__dirname, '../../dist/index.d.ts');

    when('inspected for forwarded deps', () => {
      (pkg.forwarded ?? []).forEach((dep: string) => {
        then(`should not import from ${dep}`, async () => {
          const dts = await fs.readFile(dtsPath, 'utf-8');
          expect(dts).not.toContain(`from '${dep}'`);
          expect(dts).not.toContain(`from "${dep}"`);
        });
      });
    });
  });
});
```

---

## .maintenance

when you add a new `export * from 'pkg'`:

1. add `pkg` to `dependencies` (if not already)
2. add `pkg` to `forwarded`
3. rebuild

when you remove an `export * from 'pkg'`:

1. remove `pkg` from `forwarded`
2. consider if `pkg` can be moved to `devDependencies`
3. rebuild

---

## .references

- [tsdown documentation](https://tsdown.dev/guide/)
- [tsdown dts.resolve](https://tsdown.dev/options/dts)
- [microsoft/TypeScript#42873](https://github.com/microsoft/TypeScript/issues/42873) — TS2742 type portability
- [microsoft/TypeScript#30858](https://github.com/microsoft/TypeScript/issues/30858) — transitive dependency errors
- [pnpm discussion #6367](https://github.com/orgs/pnpm/discussions/6367) — pnpm and typescript monorepos
