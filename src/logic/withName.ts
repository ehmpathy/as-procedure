import { HasName } from '../domain/HasName';
import { Procedure } from '../domain/Procedure';

/**
 * .what = adds an explicit name to a procedure
 * .why = improves observability
 */
export const withName = <TProcedure extends Procedure<any, any, any>>(
  options: string | { name: string },
  procedure: TProcedure,
): HasName<TProcedure> => {
  // grab the name from the options
  const name = typeof options === 'string' ? options : options.name;

  // assign the name to the procedure
  const named = Object.assign(procedure, { name });

  // return the procedure with name
  return named;
};
