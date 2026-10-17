// Menu links, in order. "Photos" is shown as a highlighted button.
// "Home" only appears in the phone menu and the footer: on a computer, the logo is the home link.
// A link with `soon: true` shows "Soon" in the menu and its page says "coming soon".
// To switch a page on later, delete its `soon: true`.
export const links: { href: string; label: string; soon?: boolean }[] = [
  { href: "/", label: "Home" },
  { href: "/photos", label: "Photos" },
  { href: "/sermons", label: "Sermons" },
  { href: "/give", label: "Give", soon: true },
  { href: "/missions", label: "Missions", soon: true },
  { href: "/sections", label: "Sections", soon: true },
  { href: "/counselling", label: "Counselling", soon: true },
  { href: "/about", label: "About", soon: true },
];

export const isSoon = (href: string) => Boolean(links.find((l) => l.href === href)?.soon);
