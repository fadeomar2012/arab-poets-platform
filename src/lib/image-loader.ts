import type { ImageLoaderProps } from "next/image";

const CLOUDINARY_HOST = "res.cloudinary.com";

/**
 * True when a source should be served through Cloudinary's CDN rather than the
 * default Next.js image optimization pipeline.
 */
export function isCloudinaryUrl(src: string): boolean {
  if (!src.startsWith("https://")) return false;
  try {
    const url = new URL(src);
    return url.hostname === CLOUDINARY_HOST && url.pathname.includes("/upload/");
  } catch {
    return false;
  }
}

/**
 * Sends Cloudinary media directly to Cloudinary's CDN instead of proxying it
 * through Next's /_next/image endpoint. This avoids server-side fetch timeouts
 * while still requesting a bounded width and automatic format/quality.
 *
 * This loader is applied per-image (see SmartImage) only for Cloudinary URLs;
 * local /images/* assets keep the default Next.js pipeline so they can be
 * optimized without triggering the "loader does not implement width" warning.
 */
export default function imageLoader({
  src,
  width,
  quality,
}: ImageLoaderProps): string {
  if (!isCloudinaryUrl(src)) return src;

  const url = new URL(src);

  // Old records may contain Payload's storage prefix query parameter. It is
  // irrelevant to Cloudinary and must never be forwarded to the CDN.
  url.searchParams.delete("prefix");

  const qualityValue = quality ? Math.min(Math.max(quality, 1), 100) : "auto";
  const transformation = `f_auto,q_${qualityValue},c_limit,w_${width}`;
  url.pathname = url.pathname.replace("/upload/", `/upload/${transformation}/`);

  return url.toString();
}
