export const AVATARS = [
  { id: "sky", name: "Sky", background: "#7bb7d8", hair: "#513628", skin: "#d99b72", shirt: "#2d4b8a" },
  { id: "fern", name: "Fern", background: "#92ad88", hair: "#382f2b", skin: "#b97854", shirt: "#3e623c" },
  { id: "sunny", name: "Sunny", background: "#efc37d", hair: "#bf7546", skin: "#f0c39b", shirt: "#af262d" },
  { id: "berry", name: "Berry", background: "#c39acb", hair: "#49334f", skin: "#edc5a8", shirt: "#713a78" },
  { id: "ocean", name: "Ocean", background: "#85bfc1", hair: "#302f36", skin: "#895b45", shirt: "#287d87" },
] as const;

export type AvatarId = (typeof AVATARS)[number]["id"];

export function getAvatar(id: string | null | undefined) {
  return AVATARS.find((avatar) => avatar.id === id) ?? AVATARS[0];
}

export default function Avatar({
  id,
  label,
  className = "size-12",
}: {
  id: string | null | undefined;
  label?: string;
  className?: string;
}) {
  const avatar = getAvatar(id);

  return (
    <svg
      viewBox="0 0 64 64"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={className}
      style={{ backgroundColor: avatar.background }}
    >
      <circle cx="32" cy="32" r="32" fill={avatar.background} />
      <path
        d="M11 64c1-14 9-21 21-21s20 7 21 21"
        fill={avatar.shirt}
      />
      <path
        d="M18 27c0-13 6-20 15-20 10 0 15 8 14 21l-3 10H20z"
        fill={avatar.hair}
      />
      <path
        d="M22 26c0-8 4-13 10-13s10 5 10 13v9c0 8-4 13-10 13s-10-5-10-13z"
        fill={avatar.skin}
      />
      <path
        d="M20 26c1-12 7-18 15-18 7 0 12 5 13 14-5-1-9-5-12-9-3 5-8 9-16 10z"
        fill={avatar.hair}
      />
      <circle cx="28" cy="32" r="1.3" fill="#292d32" />
      <circle cx="37" cy="32" r="1.3" fill="#292d32" />
      <path
        d="M29 39c2 2 5 2 7 0"
        fill="none"
        stroke="#9b514c"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}
