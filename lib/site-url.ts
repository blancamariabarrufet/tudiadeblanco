function normalizeUrl(value: string) {
  return value.replace(/\/+$/, "");
}

export function getSiteUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL;

  if (configuredUrl) {
    return normalizeUrl(configuredUrl);
  }

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return "";
}

export function buildSiteUrl(path: string) {
  const baseUrl = getSiteUrl();
  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}
