import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RidePerk",
    short_name: "RidePerk",
    description: "QR-powered campaigns and passenger rewards in Addis Ababa.",
    start_url: "/",
    display: "standalone",
    background_color: "#fffaf6",
    theme_color: "#8d2114",
    icons: [{ src: "/icon.png", sizes: "512x512", type: "image/png" }],
  };
}
