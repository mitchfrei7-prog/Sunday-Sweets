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
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
