/** Canonical storage format for Indian mobiles: +91XXXXXXXXXX */
export function toCanonicalIndiaPhone(input: string): string | null {
  const digits = String(input || '').replace(/\D/g, '');
  if (!digits) return null;

  let national = digits;
  if (national.startsWith('91') && national.length === 12) {
    national = national.slice(2);
  } else if (national.startsWith('0') && national.length === 11) {
    national = national.slice(1);
  }

  if (national.length !== 10) return null;
  return `+91${national}`;
}

/** MSG91 identifier format: 91XXXXXXXXXX (no +) */
export function toMsg91Identifier(input: string): string | null {
  const canonical = toCanonicalIndiaPhone(input);
  if (!canonical) return null;
  return canonical.replace('+', '');
}

/** Variants to match loosely stored profile.phone values */
export function phoneLookupVariants(input: string): string[] {
  const canonical = toCanonicalIndiaPhone(input);
  if (!canonical) return [];

  const digits = canonical.replace('+', ''); // 91XXXXXXXXXX
  const national = digits.slice(2); // XXXXXXXXXX

  return Array.from(
    new Set([
      canonical,
      digits,
      national,
      `0${national}`,
      `+${digits}`,
      `${national}`,
    ])
  );
}
