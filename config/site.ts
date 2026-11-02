export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://showmyfit.com';
export const SITE_NAME = 'ShowMyFit';
export const SITE_BRANDS = ['ShowMyFit', 'ShowMyFIT', 'Showmyfit'];

export function absoluteUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_URL}${normalized}`;
}
