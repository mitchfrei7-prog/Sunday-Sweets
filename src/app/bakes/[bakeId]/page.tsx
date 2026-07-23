import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import QRCode from "qrcode";
import { asc, desc, eq } from "drizzle-orm";
import { getDb, isDbConfigured, schema } from "@/db";
import { SetupNotice } from "@/components/setup-notice";
import { CopyLinkButton } from "@/components/copy-link-button";
import { versionName } from "@/lib/version";
import { categoryLabel } from "@/lib/categories";
import { BakeForm } from "./bake-form";
import { PhotoUploader } from "./photo-uploader";
import { deleteBakePhotoAction } from "../actions";
import { isBlobConfigured } from "@/lib/blob";

export const dynamic = "force-dynamic";

export default async function BakePage({
  params,
}: {
  params: Promise<{ bakeId: string }>;
}) {
  const { bakeId } = await params;

  if (!isDbConfigured()) {
    return (
      <main className="px-4 pt-8">
        <SetupNotice />
      </main>
    );
  }

  const db = getDb();
  const bake = await db.query.bakes.findFirst({
    where: eq(schema.bakes.id, bakeId),
    with: {
      version: { with: { recipe: true } },
      flourBlend: true,
      photos: { orderBy: [desc(schema.bakePhotos.createdAt)] },
      feedback: { orderBy: [desc(schema.feedback.createdAt)] },
    },
  });

  if (!bake) notFound();

  const blends = await db.query.flourBlends.findMany({
    orderBy: [asc(schema.flourBlends.name)],
  });

  const recipe = bake.version.recipe;

  const h = await headers();
  const host = h.get("host") ?? "sunday-sweets.vercel.app";
  const proto = host.includes("localhost") ? "http" : "https";
  const shareUrl = `${proto}://${host}/f/${bake.shareId}`;
  const qrDataUrl = await QRCode.toDataURL(shareUrl, {
    width: 220,
    margin: 1,
    color: { dark: "#241f45", light: "#f4f4ff" },
  });

  return (
    <main className="px-4 pt-8">
      <Link href="/" className="text-sm text-latte">
        ← Home
      </Link>
      <h1 className="mt-2 text-3xl">{recipe.name}</h1>
      <p className="mt-1 text-sm text-latte">
        {versionName(bake.version)} · {categoryLabel(recipe.category)}
      </p>

      {bake.version.diffSummary && (
        <p className="mt-2 text-sm text-chocolate">
          This version: {bake.version.diffSummary}
        </p>
      )}
      {bake.version.why && (
        <p className="mt-0.5 text-sm italic text-latte">
          &ldquo;{bake.version.why}&rdquo;
        </p>
      )}

      {recipe.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {recipe.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-butter px-2.5 py-1 text-xs text-chocolate"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {bake.weather?.humidity != null && (
        <p className="mt-2 text-xs text-latte">
          {bake.weather.humidity}% humidity
          {bake.weather.tempF != null && ` · ${Math.round(bake.weather.tempF)}°F`}{" "}
          (auto-logged)
        </p>
      )}

      <BakeForm
        bakeId={bake.id}
        blends={blends}
        initial={{
          bakedOn: bake.bakedOn,
          flourBlendId: bake.flourBlendId ?? "",
          notes: bake.notes ?? "",
          outcomeNotes: bake.outcomeNotes ?? "",
          rating: bake.rating ? Number(bake.rating) : 0,
          texture: bake.texture ? Number(bake.texture) : 0,
          taste: bake.taste ? Number(bake.taste) : 0,
          moisture: bake.moisture ? Number(bake.moisture) : 0,
        }}
      />

      <section className="mt-6 rounded-2xl border border-butter-dark bg-white/60 p-4">
        <h2 className="text-lg">Photos</h2>
        {bake.photos.length > 0 && (
          <ul className="mt-3 grid grid-cols-2 gap-2">
            {bake.photos.map((photo) => (
              <li key={photo.id} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.url}
                  alt="Bake photo"
                  className="aspect-square w-full rounded-xl object-cover"
                  loading="lazy"
                />
                <form action={deleteBakePhotoAction} className="absolute right-1.5 top-1.5">
                  <input type="hidden" name="photoId" value={photo.id} />
                  <input type="hidden" name="bakeId" value={bake.id} />
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
        {isBlobConfigured() ? (
          <PhotoUploader bakeId={bake.id} />
        ) : (
          <p className="mt-2 rounded-xl border border-butter-dark bg-butter/40 p-3 text-sm text-latte">
            Photo uploads aren&apos;t set up yet. Add a Vercel Blob store and the
            BLOB_READ_WRITE_TOKEN env var to enable them.
          </p>
        )}
        {bake.photos.length === 0 && isBlobConfigured() && (
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
          href={`/f/${bake.shareId}?by=emma`}
          className="mt-2 block text-sm text-terracotta-dark underline"
        >
          Or enter feedback for someone yourself
        </Link>
      </section>

      <section className="mt-4 pb-8">
        <h2 className="text-lg">Taster feedback ({bake.feedback.length})</h2>
        {bake.feedback.length === 0 ? (
          <p className="mt-2 rounded-xl border border-butter-dark bg-butter/40 p-4 text-sm text-latte">
            Nothing yet — pass the plate and the QR code around.
          </p>
        ) : (
          <ul className="mt-2 space-y-2">
            {bake.feedback.map((f) => (
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
    </main>
  );
}
