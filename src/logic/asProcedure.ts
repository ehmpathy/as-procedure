import { Procedure } from 'domain-glossary-procedure';
import { withLogTrail, HasVisualogicContext } from 'visualogic';

import { getCallerFileName } from './getCallerFileName';
import { inferProcedureName } from './inferProcedureName';

/**
 * .what = declares a javascript:function to be a procedure
 *
 * .todo =
 *   - extract name from caller fn by default
 *   - withWrappers by default
 */
export const asProcedure = <TProcedure extends Procedure>(
  logic: HasVisualogicContext<TProcedure>,
): TProcedure => {
  const callerFileName = getCallerFileName();
  const inferredProcedureName = callerFileName
    ? inferProcedureName(callerFileName)
    : undefined;
  return withLogTrail(logic, { name: inferredProcedureName }) as TProcedure;
};
