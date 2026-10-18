"use client";

import Image from "next/image";
import { useState } from "react";

export const AVATARS = [
  {
    id: "mario",
    name: "Mario",
    background: "#f4fbff",
    image: "/avatars/mario.png",
  },
  {
    id: "luigi",
    name: "Luigi",
    background: "#f9f9f9",
    image: "/avatars/luigi.png",
  },
  {
    id: "peach",
    name: "Princess Peach",
    background: "#f7f6f5",
    image: "/avatars/peach.png",
  },
  {
    id: "yoshi",
    name: "Yoshi",
    background: "#f8f6f8",
    image: "/avatars/yoshi.png",
  },
  {
    id: "toad",
    name: "Toad",
    background: "#f8f9f9",
    image: "/avatars/toad.png",
  },
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
  const [imageFailed, setImageFailed] = useState(false);

  if (imageFailed) {
    return (
      <span
        role={label ? "img" : undefined}
        aria-label={label}
        aria-hidden={label ? undefined : true}
        className={`${className} inline-flex items-center justify-center bg-white/70 font-bold text-charcoal`}
        style={{ backgroundColor: avatar.background }}
      >
        {avatar.name.charAt(0)}
      </span>
    );
  }

  return (
    <Image
      src={avatar.image}
      alt={label ?? ""}
      aria-hidden={label ? undefined : true}
      width={128}
      height={128}
      className={`${className} object-contain`}
      unoptimized
      draggable={false}
      onError={() => setImageFailed(true)}
    />
  );
}
