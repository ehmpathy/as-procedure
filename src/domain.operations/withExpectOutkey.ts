import type { Procedure, ProcedureOutput } from 'domain-glossary-procedure';
import { HelpfulError } from 'helpful-errors';
import type { Serializable } from 'serde-fns';
import type { NotNull } from 'type-fns';

import { getName } from '@src/domain.objects/HasName';

type AsExpectOutkey<R extends Record<string, Serializable | null>> = <
  K extends keyof R,
  O extends R[K],
>(
  key: K,
  operation: 'isPresent', // todo: support isNull
) => Promise<Record<K, NotNull<O>>>;

export type WithExpectOutkey<
  TLogic extends (...args: any[]) => Promise<Record<string, any>>,
> = (...args: Parameters<TLogic>) => ReturnType<TLogic> & {
  expect: AsExpectOutkey<Awaited<ReturnType<TLogic>>>;
};

export const withExpectOutkey = <I, C, O extends Promise<Record<string, any>>>(
  procedure: Procedure<I, C, O>,
): WithExpectOutkey<typeof procedure> => {
  const wrapped = (
    ...args: Parameters<typeof procedure>
  ): ReturnType<typeof procedure> & {
    expect: AsExpectOutkey<Awaited<ProcedureOutput<typeof procedure>>>;
  } => {
    // define an error which has access to the original call.stack, so we can trace the stack to the root caller, since promises loose their chain
    const errorFromOriginalCall = new HelpfulError('expect.outkey: call', {
      procedure: getName(procedure),
      input: args[0],
    });

    // invoke the request
    const promise: ProcedureOutput<typeof procedure> = procedure(...args);

    // add the expect wrapper
    const expect = async (
      key: keyof Awaited<ProcedureOutput<typeof procedure>>,
    ) => {
      const output: Awaited<ProcedureOutput<typeof procedure>> = await promise;
      const outputOfKey:
        | Awaited<ProcedureOutput<typeof procedure>>[typeof key]
        | null = output[key];
      if (!outputOfKey)
        throw new HelpfulError(
          'expect.outkey: breach: key is not present in output',
          {
            cause: errorFromOriginalCall,
            procedure: getName(procedure),
            key,
            output,
          },
        );
      const assured = { [key]: outputOfKey } as Record<
        typeof key,
        NotNull<Awaited<ProcedureOutput<typeof procedure>>[typeof key]>
      >;
      return assured;
    };
    const extended = Object.assign(promise, { expect });
    return extended as any;
  };
  return wrapped;
};
