export default function ProgressFlagIcon({
  className = "h-6 w-6",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={`${className} shrink-0`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern
          id="progress-flag-checker"
          width="8"
          height="8"
          patternUnits="userSpaceOnUse"
        >
          <rect width="8" height="8" fill="#fff" />
          <path d="M0 0h4v4H0zM4 4h4v4H4z" fill="#17191c" />
        </pattern>
        <linearGradient id="progress-flag-pole" x1="0" x2="1" y1="0" y2="0">
          <stop stopColor="#55585b" />
          <stop offset=".35" stopColor="#f4f4f4" />
          <stop offset=".7" stopColor="#898c8f" />
          <stop offset="1" stopColor="#343639" />
        </linearGradient>
        <clipPath id="progress-flag-shape">
          <path d="M6 4.5c6 1 9 1.1 13 .2 4-1 6-1 9-.1v17c-4-1-6-.9-10 .1-4 1-8 .9-12-.1V4.5Z" />
        </clipPath>
      </defs>
      <path d="M3.2 4.5a2 2 0 0 1 4 0v22a2 2 0 0 1-4 0v-22Z" fill="url(#progress-flag-pole)" stroke="#55585b" strokeWidth=".6" />
      <g clipPath="url(#progress-flag-shape)">
        <path d="M6 4.5c6 1 9 1.1 13 .2 4-1 6-1 9-.1v17c-4-1-6-.9-10 .1-4 1-8 .9-12-.1V4.5Z" fill="url(#progress-flag-checker)" />
        <path d="M6 4.5c6 1 9 1.1 13 .2 4-1 6-1 9-.1v17c-4-1-6-.9-10 .1-4 1-8 .9-12-.1V4.5Z" fill="none" stroke="#202226" strokeWidth=".8" />
      </g>
    </svg>
  );
}
