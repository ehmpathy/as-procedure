export const inferProcedureName = (input: { fileName: string }): string =>
  input.fileName
    .split('/')
    .slice(-1)[0]!
    .replace(/\.ts$/, '')
    .replace(/\.js$/, '')
    .replace('.acceptance.test', '')
    .replace('.integration.test', '')
    .replace('.test', '');
