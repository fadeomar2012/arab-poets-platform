"use client";

import Image from "@/components/ui/SmartImage";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { Locale } from "@/i18n/config";
import type { GalleryItem, MediaAsset } from "@/lib/content/types";
import { localize } from "@/lib/content/types";
import { formatDateRange } from "@/lib/format";
import { Icon } from "@/components/ui/Icon";

type Item = GalleryItem | MediaAsset;

export function Gallery({ images, locale, preview = false }: { images: Item[]; locale: Locale; preview?: boolean }) {
  const [selected, setSelected] = useState<number | null>(null);
  const close = useCallback(() => setSelected(null), []);
  const move = useCallback((amount: number) => setSelected((value) => value === null ? null : (value + amount + images.length) % images.length), [images.length]);
  useEffect(() => {
    if (selected === null) return;
    const listener = (event: KeyboardEvent) => { if (event.key === "Escape") close(); if (event.key === "ArrowRight") move(locale === "ar" ? -1 : 1); if (event.key === "ArrowLeft") move(locale === "ar" ? 1 : -1); };
    document.body.classList.add("lightbox-open"); window.addEventListener("keydown", listener); return () => { document.body.classList.remove("lightbox-open"); window.removeEventListener("keydown", listener); };
  }, [selected, close, move, locale]);
  const selectedItem = selected === null ? null : images[selected];
  return (
    <>
      <div className={`gallery-grid ${preview ? "gallery-grid--preview" : ""}`}>
        {images.map((image, index) => {
          const item = image as GalleryItem;
          return <button className="gallery-tile" onClick={() => setSelected(index)} key={`${image.url}-${index}`} type="button" aria-label={localize(image.alt, locale)}><Image src={image.url} alt={localize(image.alt, locale)} fill sizes="(max-width:700px) 50vw, 25vw" /><span className="gallery-overlay"><Icon name="image" /><strong>{item.eventTitle ? localize(item.eventTitle, locale) : localize(image.caption || image.alt, locale)}</strong>{item.eventDate ? <small>{formatDateRange(item.eventDate, undefined, locale)}</small> : null}</span></button>;
        })}
      </div>
      {selectedItem ? <div className="lightbox" role="dialog" aria-modal="true" aria-label={locale === "ar" ? "عارض الصور" : "Image viewer"} onClick={close}>
        <button className="icon-button lightbox-close" onClick={close} type="button" aria-label={locale === "ar" ? "إغلاق" : "Close"}><Icon name="close" /></button>
        {images.length > 1 ? <><button className="icon-button lightbox-nav lightbox-prev" onClick={(event) => { event.stopPropagation(); move(locale === "ar" ? 1 : -1); }} type="button" aria-label={locale === "ar" ? "الصورة السابقة" : "Previous image"}><Icon name="chevron" /></button><button className="icon-button lightbox-nav lightbox-next" onClick={(event) => { event.stopPropagation(); move(locale === "ar" ? -1 : 1); }} type="button" aria-label={locale === "ar" ? "الصورة التالية" : "Next image"}><Icon name="chevron" /></button></> : null}
        <figure className="lightbox-content" onClick={(event) => event.stopPropagation()}><div className="lightbox-image"><Image src={selectedItem.url} alt={localize(selectedItem.alt, locale)} fill sizes="90vw" /></div><figcaption><span>{(selected || 0) + 1} / {images.length}</span><h3>{(selectedItem as GalleryItem).eventTitle ? localize((selectedItem as GalleryItem).eventTitle!, locale) : localize(selectedItem.caption || selectedItem.alt, locale)}</h3>{selectedItem.credit ? <p>{locale === "ar" ? "تصوير: " : "Credit: "}{selectedItem.credit}</p> : null}{(selectedItem as GalleryItem).eventSlug ? <Link className="arrow-link" href={`/${locale}/events/${(selectedItem as GalleryItem).eventSlug}`}><span>{locale === "ar" ? "عرض الفعالية" : "View event"}</span><Icon name="arrow" /></Link> : null}</figcaption></figure>
      </div> : null}
    </>
  );
}
