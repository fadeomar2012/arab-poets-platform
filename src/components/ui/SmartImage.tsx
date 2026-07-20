"use client";

import NextImage, { type ImageProps } from "next/image";
import cloudinaryLoader, { isCloudinaryUrl } from "@/lib/image-loader";

/**
 * Drop-in replacement for next/image that routes Cloudinary URLs through the
 * Cloudinary CDN loader (bounded width + auto format/quality) while local
 * /images/* assets use the default Next.js optimization pipeline.
 *
 * This avoids the global "custom loader that does not implement width" warning
 * that occurs when a single custom loader is applied to every source.
 */
export default function SmartImage(props: ImageProps) {
  const { src } = props;
  const useCloudinary = typeof src === "string" && isCloudinaryUrl(src);

  if (useCloudinary) {
    return <NextImage {...props} loader={cloudinaryLoader} />;
  }

  return <NextImage {...props} />;
}
