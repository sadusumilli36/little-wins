# Little Wins

Little Wins is a task-management app that helps users break everyday tasks
into manageable steps and track their progress through a Mario Kart-inspired
experience.

## Inspiration

When we thought of 2016, the first thing that came to our minds was Mario
Kart. We also thought about how many people struggle to manage their everyday
tasks. Traditional to-do lists allow users to enter their tasks, but they do
not often help users plan the steps required or track their progress. As a
result, we combined this idea with Mario Kart aesthetics to create a program
that helps people who face barriers related to executive functioning and task
organization, promoting accessibility for these populations.

## What it does

Little Wins automatically generates steps and subtasks for each task a user
adds using the Google Gemini API. This provides a clear starting point and
checkpoints for the user. It also incorporates a Mario Kart-inspired theme
that aims to make task management more engaging and rewarding. Users can
choose a buddy for each task and watch the buddy move along a racetrack as
they complete subtasks. Each spot on the track represents a step toward
completing the overall task, providing a visual representation of progress.

## How we built it

- Next.js with the App Router for the application and backend API routes
- TypeScript for all application code
- Tailwind CSS for consistent styling across the frontend
- Supabase PostgreSQL for task and subtask storage
- Supabase Auth for authentication
- Google Gemini API for AI-powered task breakdown

## Challenges we ran into

One of the main challenges we ran into was integrating everyone's work into a
cohesive application. When multiple team members worked on the same
components simultaneously, we had to coordinate our changes and merge our
work appropriately so that everything was saved without overwriting anyone's
contributions.

We also faced challenges with the UI design. We had to make sure the design
was informative while maintaining a clean interface. This was an important
consideration for our target population, as an overly cluttered design could
increase cognitive load and make the application feel overwhelming. Since our
goal was to make task management more accessible and approachable, it was
important to ensure that our interface was clear without adding unnecessary
complexity.

## Accomplishments that we're proud of

One accomplishment that we're proud of is our UI design, particularly how we
created an interface that captures the 2016 vibe while remaining visually
clean and straightforward. We are especially proud of our progress page,
where we incorporated game-like elements inspired by Mario Kart to make task
management more interactive and engaging.

Features such as choosing a Mario Kart character as a buddy and watching it
move along a racetrack allowed us to transform regular task management into a
more enjoyable experience. Overall, we are proud of how we tailored our
application and features to our target population while keeping accessibility
and user needs in mind.

## What we learned

By developing Little Wins, we learned to balance functionality and
accessibility with visual design so that we can genuinely benefit our target
population. We learned to design for the needs of our target population while
considering the diverse needs, preferences, and abilities of our users.

## Relation to the theme

For the theme, we focused on enhancing accessibility for communities facing
executive functioning challenges, including people with ADHD and autism,
through inclusive technology. By automatically generating subtasks and using
a fun Mario Kart theme to track progress, we hoped to improve accessibility
by breaking down some of the barriers that inhibit users' ability to complete
their tasks and take charge of their lives.

Mario Kart was also very popular in 2016, tying into the Back to 2016 theme of
this hackathon.

## What's next for Little Wins - Health & Accessibility Track

As we move forward with Little Wins, we hope to incorporate more visual
elements and customizable features that make task management accessible to a
wider range of users. We would like to explore ways to present information in
different formats to accommodate users with varying cognitive needs. For
instance, we would also like to implement an auditory component where users
can verbally add tasks and hear their tasks spoken aloud.

Ultimately, we aim to make Little Wins a more inclusive tool that supports a
broader range of impairments and needs.

## Built With

- [CSS](https://devpost.com/software/built-with/css)
- [Google Gemini](https://devpost.com/software/built-with/gemini)
- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.com/)
- [TypeScript](https://devpost.com/software/built-with/typescript)

## Local setup

Copy `.env.example` to `.env.local` and add the Supabase URL, publishable key,
and Gemini API key before running the app. Apply the SQL migrations in
`supabase/migrations/` to configure the task tables and the atomic parent-task
completion RPC.

Start the development server:

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

Currently, Little Wins only runs locally, but we plan to deploy it to Vercel.
