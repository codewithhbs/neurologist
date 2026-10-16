import Image from 'next/image';

/**
 * next/image wrapper that never crashes on null / undefined / empty `src`.
 * Renders `fallback` (a node) when there is no usable src, or a local placeholder image.
 */
export default function SafeImage({ src, alt = '', fallback = null, ...props }) {
  const valid = typeof src === 'string' && src.trim() !== '';
  if (!valid) return fallback;
  return <Image src={src} alt={alt} {...props} />;
}
