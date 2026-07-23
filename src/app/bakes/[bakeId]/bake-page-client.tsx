"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { StarRatingInput } from "@/components/star-rating-input";
import { CopyLinkButton } from "@/components/copy-link-button";
import { PhotoUploader } from "./photo-uploader";
import {
  deleteBakeAction,
  deleteBakePhotoAction,
  saveBakeAction,
  type BakeFormState,
} from "../actions";

type Photo = { id: string; url: string };
type Feedback = {
  id: string;
  tasterName: string | null;
  overall: string;
  texture: string | null;
  taste: string | null;
  moisture: string | null;
  notes: string | null;
};

export function BakePageClient({
  bakeId,
  recipeName,
  versionTitle,
  category,
  diffSummary,
  why,
  tags,
  ingredients,
  steps,
  weather,
  blends,
  initial,
  photos,
  blobConfigured,
  qrDataUrl,
  shareUrl,
  shareId,
  feedback,
}: {
  bakeId: string;
  recipeName: string;
  versionTitle: string;
  category: string;
  diffSummary: string | null;
  why: string | null;
  tags: string[];
  ingredients: string[];
  steps: string[];
  weather: { humidity?: number; tempF?: number } | null;
  blends: { id: string; name: string }[];
  initial: {
    bakedOn: string;
    flourBlendId: string;
    notes: string;
    outcomeNotes: string;
    rating: number;
    texture: number;
    taste: number;
    moisture: number;
  };
  photos: Photo[];
  blobConfigured: boolean;
  qrDataUrl: string;
  shareUrl: string;
  shareId: string;
  feedback: Feedback[];
}) {
  const [state, formAction, pending] = useActionState<BakeFormState, FormData>(
    saveBakeAction,
    {},
  );
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <main className="px-4 pt-8">
      <Link href="/" className="text-sm text-latte">
        ← Home
      </Link>
      <h1 className="mt-2 text-3xl">{recipeName}</h1>
      <p className="mt-1 text-sm text-latte">
        {versionTitle} · {category}
      </p>

      {diffSummary && (
        <p className="mt-2 text-sm text-chocolate">This version: {diffSummary}</p>
      )}
      {why && (
        <p className="mt-0.5 text-sm italic text-latte">&ldquo;{why}&rdquo;</p>
      )}

      {tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-butter px-2.5 py-1 text-xs text-chocolate"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {weather?.humidity != null && (
        <p className="mt-2 text-xs text-latte">
          {weather.humidity}% humidity
          {weather.tempF != null && ` · ${Math.round(weather.tempF)}°F`} (auto-logged)
        </p>
      )}

      <details className="mt-4 rounded-xl border border-butter-dark bg-white/60 p-4">
        <summary className="cursor-pointer text-sm font-medium text-terracotta-dark">
          Ingredients &amp; steps
        </summary>
        <div className="mt-2 space-y-3 text-sm">
          <ul className="list-disc space-y-0.5 pl-5">
            {ingredients.map((ing, i) => (
              <li key={i}>{ing}</li>
            ))}
          </ul>
          <ol className="list-decimal space-y-1 pl-5">
            {steps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </div>
      </details>

      <form id="bake-form" action={formAction} className="mt-5 space-y-5">
        <input type="hidden" name="bakeId" value={bakeId} />

        <div>
          <label className="text-sm font-medium" htmlFor="bakedOn">
            Date
          </label>
          <input
            id="bakedOn"
            name="bakedOn"
            type="date"
            required
            defaultValue={initial.bakedOn}
            className="mt-1.5 w-full rounded-xl border border-butter-dark bg-white px-3 py-2.5"
          />
        </div>

        <div>
          <label className="text-sm font-medium" htmlFor="flourBlendId">
            Flour blend
          </label>
          <select
            id="flourBlendId"
            name="flourBlendId"
            defaultValue={initial.flourBlendId}
            className="mt-1.5 w-full rounded-xl border border-butter-dark bg-white px-3 py-2.5"
          >
            <option value="">— none —</option>
            {blends.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          <input
            name="newBlendName"
            placeholder="…or type a new blend (e.g. King Arthur Measure for Measure)"
            className="mt-2 w-full rounded-xl border border-butter-dark bg-white px-3 py-2.5"
          />
        </div>

        <div>
          <label className="text-sm font-medium" htmlFor="notes">
            What did you change or do tonight?
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            defaultValue={initial.notes}
            placeholder="−¼ cup sugar, chilled the dough 30 extra min…"
            className="mt-1.5 w-full rounded-xl border border-butter-dark bg-white px-3 py-2.5"
          />
        </div>

        <div className="rounded-2xl border border-butter-dark bg-white/60 p-4">
          <h2 className="text-lg">Emma&apos;s wrap-up</h2>
          <div className="mt-3 space-y-3">
            <StarRatingInput name="rating" label="Overall" defaultValue={initial.rating} />
            <StarRatingInput name="texture" label="Texture" defaultValue={initial.texture} />
            <StarRatingInput name="taste" label="Taste" defaultValue={initial.taste} />
            <StarRatingInput
              name="moisture"
              label="Moisture"
              defaultValue={initial.moisture}
            />
          </div>
          <p className="mt-2 text-xs text-latte">
            Rate as much or as little as you like — 5 stars = perfect.
          </p>
          <textarea
            name="outcomeNotes"
            rows={3}
            defaultValue={initial.outcomeNotes}
            placeholder="How did it turn out? Texture, taste, what you'd try next…"
            className="mt-3 w-full rounded-xl border border-butter-dark bg-white px-3 py-2.5"
          />
        </div>
      </form>

      <section className="mt-6 rounded-2xl border border-butter-dark bg-white/60 p-4">
        <h2 className="text-lg">Photos</h2>
        {photos.length > 0 && (
          <ul className="mt-3 grid grid-cols-2 gap-2">
            {photos.map((photo) => (
              <li key={photo.id} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.url}
                  alt="Bake photo"
                  className="aspect-square w-full rounded-xl object-cover"
                  loading="lazy"
                />
                <form
                  action={deleteBakePhotoAction}
                  className="absolute right-1.5 top-1.5"
                >
                  <input type="hidden" name="photoId" value={photo.id} />
                  <input type="hidden" name="bakeId" value={bakeId} />
                  <button
                    type="submit"
                    aria-label="Delete photo"
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-chocolate/70 text-sm text-cream active:bg-chocolate"
                  >
                    ✕
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
        {blobConfigured ? (
          <PhotoUploader bakeId={bakeId} />
        ) : (
          <p className="mt-2 rounded-xl border border-butter-dark bg-butter/40 p-3 text-sm text-latte">
            Photo uploads aren&apos;t set up yet. Add a Vercel Blob store and the
            BLOB_READ_WRITE_TOKEN env var to enable them.
          </p>
        )}
        {photos.length === 0 && blobConfigured && (
          <p className="mt-2 text-xs text-latte">
            Snap a shot of tonight&apos;s bake — photos are downscaled
            automatically and saved here.
          </p>
        )}
      </section>

      <section className="mt-4 rounded-2xl border border-butter-dark bg-white/60 p-4 text-center">
        <h2 className="text-lg">Get taster feedback</h2>
        <p className="mt-1 text-sm text-latte">
          Tasters scan this — no app, no login. Four quick star ratings and a
          note.
        </p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrDataUrl}
          alt="QR code linking to the feedback form for this bake"
          className="mx-auto mt-3 rounded-lg"
          width={220}
          height={220}
        />
        <p className="mt-2 break-all text-xs text-latte">{shareUrl}</p>
        <div className="mt-3">
          <CopyLinkButton url={shareUrl} />
        </div>
        <Link
          href={`/f/${shareId}?by=emma`}
          className="mt-2 block text-sm text-terracotta-dark underline"
        >
          Or enter feedback for someone yourself
        </Link>
      </section>

      <section className="mt-4">
        <h2 className="text-lg">Taster feedback ({feedback.length})</h2>
        {feedback.length === 0 ? (
          <p className="mt-2 rounded-xl border border-butter-dark bg-butter/40 p-4 text-sm text-latte">
            Nothing yet — pass the plate and the QR code around.
          </p>
        ) : (
          <ul className="mt-2 space-y-2">
            {feedback.map((f) => (
              <li
                key={f.id}
                className="rounded-xl border border-butter-dark bg-white/60 px-4 py-3"
              >
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-medium">
                    {f.tasterName || "Anonymous"}
                  </span>
                  <span className="text-sm text-honey">
                    ★ {Number(f.overall).toFixed(1)}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-latte">
                  {f.texture && `texture ${Number(f.texture).toFixed(1)} · `}
                  {f.taste && `taste ${Number(f.taste).toFixed(1)} · `}
                  {f.moisture && `moisture ${Number(f.moisture).toFixed(1)}`}
                </p>
                {f.notes && <p className="mt-1 text-sm">{f.notes}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-6 pb-8">
        {state.error && (
          <p className="mb-2 text-sm text-terracotta-dark">{state.error}</p>
        )}
        {state.saved && (
          <p className="mb-2 text-sm font-medium text-sage">Bake saved ✓</p>
        )}
        <button
          type="submit"
          form="bake-form"
          disabled={pending}
          className="w-full rounded-xl bg-terracotta py-3 font-medium text-cream active:scale-[0.99] disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save this Bake"}
        </button>

        {confirmDelete ? (
          <div className="mt-4 rounded-xl border border-butter-dark bg-butter/40 p-3">
            <p className="text-sm">
              Delete this bake and its photos + taster feedback? This can&apos;t
              be undone.
            </p>
            <div className="mt-2.5 flex gap-2">
              <form action={deleteBakeAction} className="flex-1">
                <input type="hidden" name="bakeId" value={bakeId} />
                <button
                  type="submit"
                  className="w-full rounded-lg bg-terracotta py-2 text-sm font-medium text-cream active:scale-[0.99]"
                >
                  Delete bake
                </button>
              </form>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="flex-1 rounded-lg border border-butter-dark bg-white py-2 text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="mt-4 block w-full text-center text-sm font-medium text-terracotta-dark"
          >
            Delete this bake
          </button>
        )}
      </div>
    </main>
  );
}
