export type PrefixedPick<T, K extends keyof T, P extends string> = {
  [Key in K as `${P}${string & Key}`]: T[Key]
}

export type AtLeastOneJoin<T extends readonly [unknown, ...unknown[]]> = T extends readonly [infer First, ...infer Rest]
  ? Rest extends readonly []
    ? First
    : First | AtLeastOneJoin<Rest> | (First & AtLeastOneJoin<Rest>)
  : never
