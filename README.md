# wall

A 2008-style Facebook wall. Visitors write a short message, press Share, and the post shows up at the top of the feed. Posts are stored in Supabase and stay there after a refresh. New posts from anyone else appear live.

## Setup

1. Create a project at [supabase.com](https://supabase.com).
2. Open the SQL editor and run [`supabase/schema.sql`](supabase/schema.sql). That creates the `posts` table, lets anonymous visitors read and share, turns on Realtime, and creates a public `wall-photos` bucket.
3. In Project Settings → API, copy the project URL and the anon public key.
4. Create `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

5. Install and start:

```
npm install
npm run dev
```

The wall owner’s name, networks, and city live in `lib/profile.ts`. Replace `public/profile.jpg` with your own photo.

## Deploy

Import the repo on Vercel and set the same two environment variables, then deploy. Use the production URL (`https://your-project.vercel.app`), not a preview URL.
