/**
 * .what = procedure to get the file.name that this function was called from
 */
export const getCallerFileName = (
  input: { depth: number } = { depth: 2 },
): string | undefined => {
  const originalPrepareStackTrace = Error.prepareStackTrace;
  try {
    Error.prepareStackTrace = (_, stack) => stack;
    const err = new Error();
    const stack = err.stack as unknown as NodeJS.CallSite[];

    // depth = 0 is this function
    // depth = 1 is the function that called this function
    // depth = 2 is the caller of the function that called this function
    const callSite = stack[input.depth];
    return callSite?.getFileName();
  } catch {
    return undefined;
  } finally {
    Error.prepareStackTrace = originalPrepareStackTrace;
  }
};
