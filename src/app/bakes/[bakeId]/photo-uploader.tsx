"use client";

import { useRef, useState, useTransition } from "react";
import { addBakePhotoAction } from "../actions";

/**
 * Downscale an image to a modest JPEG before upload — keeps files small (kind
 * to the free storage tier and slow kitchen wifi) and normalizes phone formats
 * like HEIC to something the app can always display. `imageOrientation` honors
 * EXIF so portrait photos don't come out sideways.
 */
async function downscaleToJpeg(
  file: File,
  maxDim = 1600,
  quality = 0.82,
): Promise<File> {
  const bitmap = await createImageBitmap(file, {
    imageOrientation: "from-image",
  });
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality),
  );
  if (!blob) throw new Error("Couldn't process that image");
  return new File([blob], "bake.jpg", { type: "image/jpeg" });
}

export function PhotoUploader({ bakeId }: { bakeId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // let the same file be re-picked later
    if (!file) return;

    setError(null);
    let resized: File;
    try {
      resized = await downscaleToJpeg(file);
    } catch {
      setError("Couldn't read that image — try a different photo.");
      return;
    }

    const fd = new FormData();
    fd.append("bakeId", bakeId);
    fd.append("photo", resized);
    startTransition(async () => {
      const res = await addBakePhotoAction(fd);
      if (res?.error) setError(res.error);
    });
  }

  return (
    <div className="mt-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={onPick}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={pending}
        className="w-full rounded-xl border border-terracotta py-2.5 text-sm font-medium text-terracotta-dark active:scale-[0.99] disabled:opacity-60"
      >
        {pending ? "Adding photo…" : "📷 Add a photo"}
      </button>
      {error && <p className="mt-1.5 text-sm text-terracotta-dark">{error}</p>}
    </div>
  );
}
