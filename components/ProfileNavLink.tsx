import Link from "next/link";

// Person-in-a-circle placeholder icon for the bottom navigation bar.
export default function ProfileNavLink({ current = false }: { current?: boolean }) {
  return (
    <Link
      href="/profile"
      aria-current={current ? "page" : undefined}
      className={`flex min-h-11 min-w-20 flex-col items-center justify-center gap-1 rounded-2xl px-4 text-sm font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal-blue ${
        current
          ? "text-royal-blue"
          : "text-charcoal/70 transition hover:bg-sky-blue"
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="size-6"
      >
        <circle
          cx="12"
          cy="12"
          r="12"
          className={current ? "fill-royal-blue" : "fill-sage-gray"}
        />
        <circle cx="12" cy="9.2" r="3.9" className="fill-white" />
        <path
          d="M3.9 19.6c1.1-3.9 4.2-6 8.1-6s7 2.1 8.1 6A11.9 11.9 0 0 1 12 24a11.9 11.9 0 0 1-8.1-4.4z"
          className="fill-white"
        />
      </svg>
      Profile
    </Link>
  );
}
