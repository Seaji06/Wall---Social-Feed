"use client";

import { useEffect, useState } from "react";
import { formatRelativeTime } from "@/lib/time";
import type { Post } from "@/lib/types";

function RelativeTime({ iso }: { iso: string }) {
  const [label, setLabel] = useState("");

  useEffect(() => {
    const update = () => setLabel(formatRelativeTime(iso));
    update();
    const id = window.setInterval(update, 30_000);
    return () => window.clearInterval(id);
  }, [iso]);

  return (
    <time dateTime={iso} className="shrink-0 text-sm text-gray-400">
      {label}
    </time>
  );
}

export function Feed({
  posts,
  loading,
  error,
}: {
  posts: Post[];
  loading: boolean;
  error: string | null;
}) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-3 size-8 animate-spin rounded-full border-2 border-gray-200 border-b-[#3b5998]" />
        <p className="text-sm text-gray-500">Loading your wall...</p>
      </div>
    );
  }

  if (error) {
    return (
      <p role="alert" className="py-8 text-sm text-red-600">
        {error}
      </p>
    );
  }

  if (posts.length === 0) {
    return (
      <p className="py-8 text-sm text-gray-500">
        Nothing on the wall yet. Write something and press Share.
      </p>
    );
  }

  return (
    <ul>
      {posts.map((post) => (
        <li key={post.id} className="border-b border-gray-200 py-4">
          <div className="flex items-baseline justify-between gap-4">
            <p className="font-bold text-gray-900">{post.name}</p>
            <RelativeTime iso={post.created_at} />
          </div>
          <p className="mt-1 whitespace-pre-wrap text-[15px] leading-6 text-gray-800">
            {post.body}
          </p>
          {post.image_url ? (
            // User-uploaded images live on Supabase and are not known at build time.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.image_url}
              alt=""
              className="mt-3 max-h-80 rounded-md border border-gray-200 object-contain"
            />
          ) : null}
        </li>
      ))}
    </ul>
  );
}
