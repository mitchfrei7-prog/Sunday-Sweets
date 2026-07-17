import Anthropic from "@anthropic-ai/sdk";

export type ExtractedRecipe = {
  name: string;
  category: "cookies" | "brownies" | "cake" | "bites" | "other";
  ingredients: string[];
  steps: string[];
  isGlutenFree: boolean;
};

const EXTRACTION_MODEL = process.env.EXTRACTION_MODEL ?? "claude-haiku-4-5";

const recipeSchema = {
  type: "object" as const,
  properties: {
    name: { type: "string", description: "The recipe title" },
    category: {
      type: "string",
      enum: ["cookies", "brownies", "cake", "bites", "other"],
      description: "Best-fit category for this recipe",
    },
    ingredients: {
      type: "array",
      items: { type: "string" },
      description: "One ingredient per entry, with quantity, e.g. '2 cups almond flour'",
    },
    steps: {
      type: "array",
      items: { type: "string" },
      description: "One instruction step per entry, in order",
    },
    isGlutenFree: {
      type: "boolean",
      description: "True if the recipe as written is gluten-free (uses GF flours)",
    },
  },
  required: ["name", "category", "ingredients", "steps", "isGlutenFree"],
  additionalProperties: false,
};

/** Fetch a recipe page and turn it into readable text for the model. */
async function fetchPageText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (SundaySweets recipe importer)" },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) {
    throw new Error(`Could not load that page (HTTP ${res.status}).`);
  }
  const html = await res.text();
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
  // Recipe content sits well within this window; beyond it is comments/boilerplate.
  return text.slice(0, 60_000);
}

export async function extractRecipeFromUrl(
  url: string,
): Promise<ExtractedRecipe> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Add it to .env.local to use recipe extraction.",
    );
  }

  const pageText = await fetchPageText(url);
  const client = new Anthropic();

  const response = await client.messages.create({
    model: EXTRACTION_MODEL,
    max_tokens: 4096,
    output_config: {
      format: { type: "json_schema", schema: recipeSchema },
    },
    messages: [
      {
        role: "user",
        content:
          "Extract the recipe from this web page text. Keep ingredient quantities " +
          "exactly as written. If the page has multiple recipes, extract the main one.\n\n" +
          pageText,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("The AI could not read a recipe from that page.");
  }
  return JSON.parse(textBlock.text) as ExtractedRecipe;
}
