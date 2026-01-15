export type HasName<T> = T & { name: string };

export const hasName = <T>(input: T): input is HasName<T> =>
  !!(input as any).name;

export const getName = <T>(input: HasName<T>): string => input.name;
