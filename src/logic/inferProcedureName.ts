export const inferProcedureName = (fileName: string): string =>
  fileName
    .split('/')
    .slice(-1)[0]!
    .replace(/\.ts$/, '')
    .replace('.acceptance.test', '')
    .replace('.integration.test', '')
    .replace('.test', '');
