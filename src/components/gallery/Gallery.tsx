"use client";

import Image from "next/image";
import { useState } from "react";

export function Gallery({ images }: { images: string[] }) {
  const [selected, setSelected] = useState<string | null>(null);
  return <>
    <div className="gallery-grid">{images.map((image, index) => <button className="gallery-tile" onClick={() => setSelected(image)} key={`${image}-${index}`}><Image src={image} alt="" fill sizes="(max-width: 700px) 50vw, 25vw" /></button>)}</div>
    {selected ? <div className="lightbox" role="dialog" aria-modal="true" onClick={() => setSelected(null)}><button aria-label="Close">×</button><div className="lightbox-image"><Image src={selected} alt="" fill sizes="90vw" /></div></div> : null}
  </>;
}
