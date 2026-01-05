import { HelpfulError } from 'helpful-errors';
import type { NotNull } from 'type-fns';

import { getName } from '@src/domain.objects/HasName';

type ExpectOutputIsPresent<O extends Record<string, any> | null> = (
  operation: 'isPresent',
) => Promise<NotNull<O>>;

type ExpectOutput<O extends Record<string, any> | null> =
  ExpectOutputIsPresent<O>;
// | ExpectOutputIsNull;

export type WithExpectOutput<
  TLogic extends (...args: any[]) => Promise<Record<string, any> | null>,
> = (...args: Parameters<TLogic>) => ReturnType<TLogic> & {
  expect: ExpectOutput<Awaited<ReturnType<TLogic>>>;
};

export const withExpectOutput = <
  O extends Record<string, any> | null,
  TLogic extends (...args: any[]) => Promise<O>,
>(
  logic: TLogic,
): WithExpectOutput<TLogic> => {
  const wrapped = (
    ...args: Parameters<typeof logic>
  ): ReturnType<typeof logic> & {
    expect: ExpectOutput<Awaited<ReturnType<typeof logic>>>;
  } => {
    // define an error which has access to the original call, so we can trace the stack to the root caller, since promises loose their chain
    const errorFromOriginalCall = new HelpfulError('expect.output: call', {
      procedure: getName(logic),
      input: args[0],
    });

    // invoke the request
    const promise = logic(...args);

    // add the expect wrapper
    const expect: ExpectOutput<O> = (async (
      operation: 'isPresent' | 'isNull',
    ) => {
      const result = await promise;
      const output: O | null = result;
      if (operation === 'isPresent' && !output)
        throw new HelpfulError('expect.output: breach: output is not present', {
          cause: errorFromOriginalCall,
          procedure: getName(logic),
          output,
        });
      if (operation === 'isNull' && output)
        throw new HelpfulError('expect.isNull failed for procedure', {
          cause: errorFromOriginalCall,
          procedure: getName(logic),
          output,
        });
      return output;
    }) as ExpectOutput<O>;
    const extended = Object.assign(promise, { expect });
    return extended as any;
  };
  return wrapped;
};
