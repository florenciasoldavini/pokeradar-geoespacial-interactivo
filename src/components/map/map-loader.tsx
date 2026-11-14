"use client";

import dynamic from "next/dynamic";
import { ScreenWarmup } from "@/components/map/screen-status";

/** `ssr: false` must live in a Client Component (App Router rule). */
export const MapLoader = dynamic(() => import("./map-view").then((mod) => mod.MapView), {
  ssr: false,
  loading: () => <ScreenWarmup />,
});
