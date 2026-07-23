import { notFound } from "next/navigation";
import { headers } from "next/headers";
import QRCode from "qrcode";
import { asc, desc, eq } from "drizzle-orm";
import { getDb, isDbConfigured, schema } from "@/db";
import { SetupNotice } from "@/components/setup-notice";
import { versionName } from "@/lib/version";
import { categoryLabel } from "@/lib/categories";
import { isBlobConfigured } from "@/lib/blob";
import { BakePageClient } from "./bake-page-client";

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
    <BakePageClient
      bakeId={bake.id}
      recipeName={recipe.name}
      versionTitle={versionName(bake.version)}
      category={categoryLabel(recipe.category)}
      diffSummary={bake.version.diffSummary}
      why={bake.version.why}
      tags={recipe.tags}
      ingredients={bake.version.ingredients}
      steps={bake.version.steps}
      weather={bake.weather ?? null}
      blends={blends.map((b) => ({ id: b.id, name: b.name }))}
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
      photos={bake.photos.map((p) => ({ id: p.id, url: p.url }))}
      blobConfigured={isBlobConfigured()}
      qrDataUrl={qrDataUrl}
      shareUrl={shareUrl}
      shareId={bake.shareId}
      feedback={bake.feedback.map((f) => ({
        id: f.id,
        tasterName: f.tasterName,
        overall: f.overall,
        texture: f.texture,
        taste: f.taste,
        moisture: f.moisture,
        notes: f.notes,
      }))}
    />
  );
}
