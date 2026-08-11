/** Replace `{name}` placeholders in a dictionary string. Client-safe. */
export function t(
  template: string,
  vars?: Record<string, string | number | undefined | null>,
) {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const value = vars[key];
    return value == null ? "" : String(value);
  });
}
