export type Pattern = [
  RegExp,
  string | ((substring: string, ...args: any[]) => string)
];
