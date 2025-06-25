# as-procedure

![test](https://github.com/ehmpathy/as-procedure/workflows/test/badge.svg)
![publish](https://github.com/ehmpathy/as-procedure/workflows/publish/badge.svg)

easily create procedures within a pit-of-success

# install

```sh
npm install
```

# use

for example

```ts
const procedure: Procedure<{ exid: string }, { dbConnection: DatabaseConnection }, { flag: Flag } | null> = (input, context) => {...}

const input: ProcedureInput<typeof procedure> = { exid: '__exid__' };

const procedureWithExpect = withExpectOutkey(procedure);

const { flag } = await procedureWithExpect({ exid: 'usa' }, context).expect('flag', 'isPresent');
```
