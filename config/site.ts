export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://showmyfit.com';
export const SITE_NAME = 'ShowMyFIT';

export function absoluteUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_URL}${normalized}`;
}
