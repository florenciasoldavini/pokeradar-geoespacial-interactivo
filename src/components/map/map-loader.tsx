"use client";

import dynamic from "next/dynamic";

/**
 * `ssr: false` is only allowed inside a Client Component in the App Router,
 * so the dynamic import lives here rather than in page.tsx.
 */
export const MapLoader = dynamic(
  () => import("@/components/map/map-view").then((mod) => mod.MapView),
  {
    ssr: false,
    loading: () => <MapSkeleton />,
  },
);

function MapSkeleton() {
  return (
    <div className="absolute inset-0 grid place-items-center bg-radar-bg">
      <div className="relative grid size-40 place-items-center rounded-full border border-radar/20">
        <div className="absolute inset-6 rounded-full border border-radar/15" />
        <div className="absolute inset-0 animate-spin rounded-full bg-[conic-gradient(from_0deg,transparent_75%,var(--color-radar))] opacity-40 [animation-duration:2s]" />
        <span className="relative font-mono text-xs tracking-widest text-radar uppercase">
          Calibrando radar…
        </span>
      </div>
    </div>
  );
}
