import type { ImageLoaderProps } from "next/image";

const CLOUDINARY_HOST = "res.cloudinary.com";

/**
 * Sends Cloudinary media directly to Cloudinary's CDN instead of proxying it
 * through Next's /_next/image endpoint. This avoids server-side fetch timeouts
 * while still requesting a bounded width and automatic format/quality.
 */
export default function imageLoader({
  src,
  width,
  quality,
}: ImageLoaderProps): string {
  if (!src.startsWith("https://")) return src;

  let url: URL;
  try {
    url = new URL(src);
  } catch {
    return src;
  }

  if (url.hostname !== CLOUDINARY_HOST || !url.pathname.includes("/upload/")) {
    return src;
  }

  // Old records may contain Payload's storage prefix query parameter. It is
  // irrelevant to Cloudinary and must never be forwarded to the CDN.
  url.searchParams.delete("prefix");

  const qualityValue = quality ? Math.min(Math.max(quality, 1), 100) : "auto";
  const transformation = `f_auto,q_${qualityValue},c_limit,w_${width}`;
  url.pathname = url.pathname.replace("/upload/", `/upload/${transformation}/`);

  return url.toString();
}
