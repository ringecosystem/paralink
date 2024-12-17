type Capitalize<S extends string> = S extends `${infer F}${infer R}`
  ? `${Uppercase<F>}${R}`
  : S;

export type ToParamCase<T> = {
  [K in keyof T as Capitalize<string & K>]: T[K] extends object
    ? ToParamCase<T[K]>
    : T[K];
};
