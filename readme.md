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


### `withExpectOutkey`

```ts
const getFlagByExid = (input: { exid: string }, context: ContextLogTrail): { flag: Flag } | null => {...}

export const sdk = {
  getFlagByExid: withExpectOutkey(getFlagByExid)
}

const { flag } = await sdk.getFlagByExid({ exid: 'usa' }, context).expect('flag', 'isPresent');
```
