"use client";

import { useEffect, useState } from "react";
import { Composer } from "@/components/composer";
import { Feed } from "@/components/feed";
import { Sidebar } from "@/components/sidebar";
import { profile } from "@/lib/profile";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { Post } from "@/lib/types";

const POST_COLUMNS = "id, name, body, image_url, created_at";

const retiredSampleBodies = new Set([
  "Hey Greg, did you debug your coffee maker yet? Last cup tasted like JavaScript errors.",
  "Greg, saw your last coding session—pretty sure you broke Stack Overflow again! 🚨",
  "Greg, are you still coding in pajamas, or have you upgraded to full-time sweatpants mode?",
  "Greg, rumor has it your computer has more stickers than code running on it. Confirm?",
  "Yo Greg, just pulled an all-nighter on the assignment. Turns out sleep deprivation doesn't improve coding skills. Weird!",
  "Greg, when are we gonna deploy your latest dance moves to production? #AgileDancer",
]);

function isVisiblePost(post: Post) {
  return !retiredSampleBodies.has(post.body);
}

function friendlyError(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes("row-level security")) {
    return "Supabase blocked that post. Run supabase/schema.sql so visitors can read and share posts.";
  }
  if (lower.includes("does not exist") || lower.includes("schema cache") || lower.includes("column")) {
    return "The posts table isn't ready. Run supabase/schema.sql in the Supabase SQL editor.";
  }
  if (lower.includes("wall-photos") || lower.includes("bucket")) {
    return message;
  }
  return message;
}

function prepend(posts: Post[], post: Post) {
  const next = posts.some((item) => item.id === post.id) ? posts : [post, ...posts];
  return next
    .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
    .slice(0, 50);
}

export function WallApp() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) return;

    let active = true;
    const client = supabase;

    async function load() {
      const { data, error: loadError } = await client
        .from("posts")
        .select(POST_COLUMNS)
        .order("created_at", { ascending: false })
        .limit(50);

      if (!active) return;
      if (loadError) setError(friendlyError(loadError.message));
      else setPosts(((data ?? []) as Post[]).filter(isVisiblePost));
      setLoading(false);
    }

    load();

    const channel = client
      .channel("posts-feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "posts" },
        (payload) => {
          const post = payload.new as Post;
          if (!isVisiblePost(post)) return;
          setPosts((current) => prepend(current, post));
        },
      )
      .subscribe();

    return () => {
      active = false;
      void client.removeChannel(channel);
    };
  }, []);

  async function share(body: string, file: File | null) {
    if (!supabase) {
      throw new Error("Add your Supabase URL and anon key to .env.local, then restart the app.");
    }

    let imageUrl: string | null = null;
    if (file) {
      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from("wall-photos")
        .upload(path, file, { contentType: file.type, upsert: false });

      if (uploadError) {
        throw new Error(
          "Couldn't upload that photo. In Supabase Storage, create a public bucket named wall-photos (the SQL file does this).",
        );
      }

      imageUrl = supabase.storage.from("wall-photos").getPublicUrl(path).data.publicUrl;
    }

    const { data, error: insertError } = await supabase
      .from("posts")
      .insert({
        name: profile.name,
        body,
        image_url: imageUrl,
      })
      .select(POST_COLUMNS)
      .single();

    if (insertError) throw new Error(friendlyError(insertError.message));
    if (data) setPosts((current) => prepend(current, data as Post));
  }

  return (
    <div className="min-h-screen bg-[#e7ebf0] text-gray-900">
      <header className="bg-[#3b5998] text-white">
        <div className="mx-auto flex h-12 w-full max-w-5xl items-center px-4">
          <span className="rounded bg-white/15 px-2 py-0.5 text-lg font-bold tracking-tight">
            wall
          </span>
        </div>
      </header>

      <main className="mx-auto min-h-[calc(100vh-3rem)] max-w-5xl bg-white shadow-sm">
        <div className="grid md:grid-cols-[240px_minmax(0,1fr)]">
          <Sidebar />
          <section className="px-4 py-4 md:px-6 md:py-5">
            {!isSupabaseConfigured ? (
              <p className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                Add <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
                <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to <code>.env.local</code>, then
                restart. The SQL in <code>supabase/schema.sql</code> creates the posts table.
              </p>
            ) : null}
            <Composer onShare={share} />
            <Feed posts={posts} loading={loading} error={error} />
          </section>
        </div>
      </main>
    </div>
  );
}
