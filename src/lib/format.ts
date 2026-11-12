/** "mr-mime" → "Mr Mime", "porygon2" → "Porygon2" */
export function formatSlug(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
