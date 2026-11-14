/** "mr-mime" → "Mr Mime", "porygon2" → "Porygon2" */
export function formatSlug(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** "1 potenciado", "3 potenciados": Spanish count + noun or adjective. */
export function plural(count: number, one: string, many = `${one}s`): string {
  return `${count} ${count === 1 ? one : many}`;
}
