"use client";

import dynamic from "next/dynamic";

/** `ssr: false` must live in a Client Component (App Router rule). */
export const MapLoader = dynamic(() => import("./map-view").then((mod) => mod.MapView), {
  ssr: false,
  loading: () => <ScreenWarmup />,
});

/** The screen warming up while MapLibre and the tiles load. */
function ScreenWarmup() {
  return (
    <div className="absolute inset-0 grid place-items-center bg-[#06110c]">
      <div className="relative grid size-40 place-items-center rounded-full border border-radar/20">
        <div className="absolute inset-6 rounded-full border border-radar/15" />
        <div className="bz-spin absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,transparent_75%,var(--color-radar))] opacity-40" />
        <span className="dex-font-lcd dex-lcd-text relative text-sm uppercase">Encendiendo…</span>
      </div>
    </div>
  );
}
