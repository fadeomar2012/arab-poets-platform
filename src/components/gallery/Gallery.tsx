"use client";

import Image from "next/image";
import { useState } from "react";
import type { Locale } from "@/i18n/config";
import type { MediaAsset } from "@/lib/content/types";
import { localize } from "@/lib/content/types";

export function Gallery({ images, locale }: { images: MediaAsset[]; locale: Locale }) {
  const [selected, setSelected] = useState<MediaAsset | null>(null);

  return (
    <>
      <div className="gallery-grid">
        {images.map((image, index) => (
          <button
            className="gallery-tile"
            onClick={() => setSelected(image)}
            key={`${image.url}-${index}`}
            type="button"
            aria-label={localize(image.alt, locale)}
          >
            <Image
              src={image.url}
              alt={localize(image.alt, locale)}
              fill
              sizes="(max-width: 700px) 50vw, 25vw"
            />
          </button>
        ))}
      </div>
      {selected ? (
        <div className="lightbox" role="dialog" aria-modal="true" onClick={() => setSelected(null)}>
          <button
            className="lightbox-close"
            onClick={() => setSelected(null)}
            type="button"
            aria-label={locale === "ar" ? "إغلاق" : "Close"}
          >
            ×
          </button>
          <div className="lightbox-image" onClick={(event) => event.stopPropagation()}>
            <Image
              src={selected.url}
              alt={localize(selected.alt, locale)}
              fill
              sizes="90vw"
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
