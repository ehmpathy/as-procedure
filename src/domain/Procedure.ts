/**
 * what: the shape of an observable procedure
 *
 * what^2:
 * - observable = easy to read, monitor, and maintain
 * - procedure = an executable of a tactic; tactic.how.procedure::Executable
 *
 * note
 * - javascript's "functions" are actually, by definition, procedures
 */
export type Procedure<TInput, TContext, TOutput> = (
  /**
   * the input of the procedure
   */
  input: TInput,

  /**
   * the context within which the procedure runs
   */
  context?: TContext,
) => TOutput;

/**
 * extracts the input::Type of a procedure
 */
export type ProcedureInput<T extends Procedure<any, any, any>> =
  Parameters<T>[0];

/**
 * extracts the context::Type of a procedure
 */
export type ProcedureContext<T extends Procedure<any, any, any>> =
  Parameters<T>[1];

/**
 * extracts the output::Type of a procedure
 */
export type ProcedureOutput<T extends Procedure<any, any, any>> = ReturnType<T>;
