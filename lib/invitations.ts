export function buildJoinUrl(code: string) {
  const encodedCode = encodeURIComponent(code);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (!siteUrl) {
    return `/join?code=${encodedCode}`;
  }

  return new URL(`/join?code=${encodedCode}`, siteUrl).toString();
}
