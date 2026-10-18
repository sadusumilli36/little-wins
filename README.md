Little Wins is a Next.js app with Supabase-backed tasks and subtasks.

## Local setup

Copy `.env.local.example` to `.env.local` and add the Supabase URL and
publishable key before running the app. Also the Gemini API Key whenever that is implemented. The home page reads authenticated tasks
and subtasks from the `tasks` and `subtasks` tables. Row-level security means
users must be signed in before their tasks can be loaded.

## Pages

- `/` shows upcoming tasks and subtasks.
- `/progress` shows progress tracks for the signed-in user's non-completed
  tasks. It reads tasks and subtasks from Supabase; the home page owns the
  subtask interaction. Add the finish-line image at
  `public/images/finish-flag.png` to replace the placeholder.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
