import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sunday Sweets",
    short_name: "Sunday Sweets",
    description: "Emma's gluten-free baking lab notebook",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f4ff",
    theme_color: "#f4f4ff",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
