/** Space-separated ids for `aria-describedby` or `aria-labelledby`, without the empty ones; undefined when there are none. */
export function joinIds(...ids: Array<string | false | null | undefined>): string | undefined {
  const list = ids.filter(Boolean).join(" ")
  return list || undefined
}
