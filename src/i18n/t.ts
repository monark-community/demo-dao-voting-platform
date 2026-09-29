/**
 * Replace {placeholders} in a dictionary string. Client-safe (no dictionaries imported).
 * Also glues French typographic spaces (before % » : ? ! ; and after «) with a
 * no-break space, so "20 %" never wraps between the number and its sign.
 */
export function t(template: string, vars: Record<string, string | number> = {}): string {
  return template
    .replace(/\{(\w+)\}/g, (match, key: string) => (key in vars ? String(vars[key]) : match))
    .replace(/ ([%»:?!;])/g, " $1")
    .replace(/« /g, "« ")
}
