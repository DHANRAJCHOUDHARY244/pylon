/** Drop keys whose value is `undefined` (keeps null). Needed for exactOptionalPropertyTypes. */
export function omitUndefined<T extends Record<string, unknown>>(obj: T): {
  [K in keyof T as undefined extends T[K] ? never : K]: Exclude<T[K], undefined>;
} & {
  [K in keyof T as undefined extends T[K] ? K : never]?: Exclude<T[K], undefined>;
} {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) out[key] = value;
  }
  return out as never;
}
