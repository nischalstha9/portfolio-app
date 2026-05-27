const MAIN_DOMAIN = process.env.NEXT_PUBLIC_MAIN_DOMAIN || "portfolio.local";

export function getMainDomain() {
  return MAIN_DOMAIN;
}

export function appUrl(path: string = "/") {
  return `http://app.${MAIN_DOMAIN}${path}`;
}

export function adminUrl(path: string = "/") {
  return `http://admin.${MAIN_DOMAIN}${path}`;
}

export function portfolioUrl(slug: string) {
  return `http://${slug}.public-resume.app.${MAIN_DOMAIN}`;
}

export type SubdomainType = "app" | "admin" | "portfolio" | "unknown";

export function detectSubdomain(host: string): { type: SubdomainType; slug?: string } {
  const h = host.split(":")[0];

  if (h === `app.${MAIN_DOMAIN}`) {
    return { type: "app" };
  }
  if (h === `admin.${MAIN_DOMAIN}`) {
    return { type: "admin" };
  }

  const publicResumeSuffix = `.public-resume.app.${MAIN_DOMAIN}`;
  if (h.endsWith(publicResumeSuffix)) {
    const slug = h.slice(0, -publicResumeSuffix.length);
    if (slug && !slug.includes(".")) {
      return { type: "portfolio", slug };
    }
  }

  return { type: "unknown" };
}
