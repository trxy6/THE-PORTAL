export function openBrowserSearch(query: string) {
  window.open(
    `https://www.google.com/search?q=${encodeURIComponent(query)}`,
    "_blank",
    "noopener"
  );
  return { ok: true };
}
