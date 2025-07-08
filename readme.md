# as-procedure

![test](https://github.com/ehmpathy/as-procedure/workflows/test/badge.svg)
![publish](https://github.com/ehmpathy/as-procedure/workflows/publish/badge.svg)

easily create procedures within a pit-of-success

# install

```sh
npm install as-procedure
```

# use

### `asProcedure`

- detects name based on declarer file name
- with-log-trail for observability

```ts
const getJokes = asProcedure((input: { by: { ref: Ref<typeof Joke> }}, context) => {
  // ...
})
```

### `withExpectOutput`

Wraps an async function that returns a `Record<string, any> | null`, and adds an `.expect('isPresent')` method to assert that the output is not null.

#### usage

```ts
import { withExpectOutput } from './withExpectOutput';

const findUser = withExpectOutput(async (input: { id: string }) => {
  if (input.id === 'missing') return null;
  return { id: input.id, name: 'Alice' };
});

// with .expect('isPresent')
const userA = await findUser({ id: 'abc123' }).expect('isPresent');
console.log(user.name); // 'Alice'

// without .expect('isPresent')
const userB = await findUser({ id: 'abc123' })
console.log(user.name); // 🛑 @ts-expect-error: "name" is not a property of null, user may be null
```

behavior
- .expect('isPresent') throws a HelpfulError if the result is null
- attaches the original call stack as the .cause for better traceability

> tip: use .expect('isPresent') in tests or control flow where null is unexpected

### `withExpectOutkey`

```ts
const getFlagByExid = (input: { exid: string }, context: ContextLogTrail): { flag: Flag } | null => {...}

export const sdk = {
  getFlagByExid: withExpectOutkey(getFlagByExid)
}

const { flag } = await sdk.getFlagByExid({ exid: 'usa' }, context).expect('flag', 'isPresent');
```
