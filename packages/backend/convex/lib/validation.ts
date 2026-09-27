import { ConvexError } from 'convex/values';

export function validateContent(value: unknown, key = ''): void {
  if (typeof value === 'string') {
    if (value.length > 20000) throw new ConvexError(`${key} is too long.`);
    if (/url$|^(image|logo)$/i.test(key) && value) {
      let url: URL;
      try {
        url = new URL(value);
      } catch {
        throw new ConvexError(`${key} must be a valid HTTPS URL.`);
      }
      if (url.protocol !== 'https:' || url.username || url.password)
        throw new ConvexError(`${key} must use HTTPS without credentials.`);
    }
  } else if (Array.isArray(value)) {
    if (value.length > 500)
      throw new ConvexError(`${key} has too many entries.`);
    value.forEach((item) => validateContent(item, key));
  } else if (value && typeof value === 'object') {
    for (const [field, item] of Object.entries(value))
      validateContent(item, field);
  } else if (
    typeof value === 'number' &&
    (!Number.isFinite(value) ||
      (key === 'order' && (!Number.isInteger(value) || value < 1)))
  ) {
    throw new ConvexError(`${key} must be a positive integer.`);
  }
}

export const ASSET_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
]);
export function validateAsset(type: string | undefined, size: number) {
  if (
    !type ||
    !ASSET_TYPES.has(type) ||
    size <= 0 ||
    size > (type === 'application/pdf' ? 10 : 5) * 1024 * 1024
  ) {
    throw new ConvexError(
      'Use a JPG, PNG, or WebP up to 5 MB, or a PDF up to 10 MB.',
    );
  }
}
