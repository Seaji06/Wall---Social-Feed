"use client";

import { useRef, useState, type FormEvent } from "react";
import { ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MAX_PHOTO_BYTES, MAX_POST_LENGTH } from "@/lib/profile";

export function Composer({
  disabled,
  onShare,
}: {
  disabled?: boolean;
  onShare: (body: string, file: File | null) => Promise<void>;
}) {
  const [body, setBody] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const remaining = MAX_POST_LENGTH - body.length;
  const canShare = !disabled && !submitting && body.trim().length > 0 && remaining >= 0;

  function clearPhoto() {
    setFile(null);
    setPreview((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
    if (fileInput.current) fileInput.current.value = "";
  }

  function onFileChange(next: File | undefined) {
    setError(null);
    if (!next) {
      clearPhoto();
      return;
    }
    if (!next.type.startsWith("image/")) {
      setError("Choose an image file.");
      return;
    }
    if (next.size > MAX_PHOTO_BYTES) {
      setError("Photos need to be 5 MB or smaller.");
      return;
    }
    setFile(next);
    setPreview((current) => {
      if (current) URL.revokeObjectURL(current);
      return URL.createObjectURL(next);
    });
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canShare) return;

    setSubmitting(true);
    setError(null);
    try {
      await onShare(body.trim(), file);
      setBody("");
      clearPhoto();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Couldn't share that post.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="border-b border-gray-200 pb-4">
      <Textarea
        value={body}
        onChange={(event) => {
          setBody(event.target.value.slice(0, MAX_POST_LENGTH));
          setError(null);
        }}
        maxLength={MAX_POST_LENGTH}
        placeholder="What's on your mind?"
        aria-label="What's on your mind?"
        disabled={disabled || submitting}
        className="min-h-28 resize-none rounded-md border-dashed border-gray-300 bg-[#f7f9fc] px-3 py-3 text-base text-gray-800 shadow-none placeholder:text-gray-400 focus-visible:border-[#3b5998] focus-visible:ring-[#3b5998]/25 md:text-base"
      />

      {preview ? (
        <div className="relative mt-3 inline-block">
          {/* Local preview of a file the visitor just picked. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Selected photo preview"
            className="max-h-48 rounded-md border border-gray-200"
          />
          <button
            type="button"
            onClick={clearPhoto}
            className="absolute top-2 right-2 inline-flex size-7 items-center justify-center rounded-full bg-black/60 text-white"
            aria-label="Remove photo"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : null}

      <p
        className={`mt-2 text-xs ${remaining < 20 ? "text-red-600" : "text-gray-500"}`}
        aria-live="polite"
      >
        {remaining} {remaining === 1 ? "character" : "characters"} remaining
      </p>

      {error ? (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      ) : null}

      <div className="mt-2 flex items-center justify-between gap-3">
        <label className="inline-flex cursor-pointer items-center gap-1.5 text-sm text-gray-600 hover:text-[#3b5998]">
          <ImagePlus className="size-4" />
          Add photo
          <input
            ref={fileInput}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="sr-only"
            onChange={(event) => onFileChange(event.target.files?.[0])}
            disabled={disabled || submitting}
          />
        </label>

        <Button
          type="submit"
          disabled={!canShare}
          className="min-w-20 cursor-pointer bg-[#3b5998] px-4 text-white hover:bg-[#2d4373] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400 disabled:opacity-100"
        >
          {submitting ? "Sharing..." : "Share"}
        </Button>
      </div>
    </form>
  );
}
