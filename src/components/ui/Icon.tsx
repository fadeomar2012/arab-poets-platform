import type { SVGProps } from "react";

export type IconName =
  | "arrow"
  | "calendar"
  | "chevron"
  | "clock"
  | "close"
  | "email"
  | "external"
  | "filter"
  | "globe"
  | "image"
  | "location"
  | "menu"
  | "people"
  | "search"
  | "sparkle"
  | "whatsapp";

const paths: Record<IconName, React.ReactNode> = {
  arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></>,
  chevron: <path d="m9 18 6-6-6-6" />,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  email: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></>,
  external: <><path d="M14 4h6v6M20 4l-9 9"/><path d="M18 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h6"/></>,
  filter: <path d="M4 6h16M7 12h10M10 18h4" />,
  globe: <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></>,
  image: <><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 20"/></>,
  location: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  people: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
  search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
  sparkle: <><path d="m12 3 1.4 4.1L17.5 8.5l-4.1 1.4L12 14l-1.4-4.1-4.1-1.4 4.1-1.4L12 3Z"/><path d="m18.5 14 .8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z"/></>,
  whatsapp: <><path d="M20.5 11.5a8.5 8.5 0 0 1-12.6 7.45L3 20l1.08-4.68A8.5 8.5 0 1 1 20.5 11.5Z"/><path d="M8.2 7.7c.2-.45.42-.46.72-.47h.62c.2 0 .4.07.5.35l.72 1.75c.08.2.04.38-.1.57l-.55.7c-.12.15-.14.3-.05.48.42.82 1.04 1.5 1.82 2 .2.12.36.1.52-.08l.72-.83c.17-.2.36-.23.58-.14l1.73.81c.22.1.34.26.31.5-.12.84-.48 1.51-1.22 1.88-.56.28-1.3.4-2.4-.04-1.16-.46-2.68-1.35-4.03-3.32-1.12-1.63-1.2-2.96-.92-3.72.15-.42.55-1.04 1.03-1.41Z"/></>,
};

export function Icon({ name, ...props }: { name: IconName } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="1em"
      viewBox="0 0 24 24"
      width="1em"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      {...props}
    >
      {paths[name]}
    </svg>
  );
}
