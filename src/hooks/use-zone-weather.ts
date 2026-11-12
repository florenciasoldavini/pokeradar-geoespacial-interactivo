"use client";

import { useEffect, useState } from "react";
import { fetchZoneWeather, type ZoneWeather } from "@/lib/weather";
import type { Zone } from "@/lib/zones";

/** Open-Meteo refreshes its "current" values every 15 minutes. */
const REFRESH_MS = 15 * 60 * 1000;

export type WeatherState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; byZone: Record<string, ZoneWeather> };

export function useZoneWeather(zones: readonly Zone[]): WeatherState {
  const [state, setState] = useState<WeatherState>({ status: "loading" });

  useEffect(() => {
    let controller = new AbortController();

    function load() {
      controller.abort();
      controller = new AbortController();
      const { signal } = controller;
      fetchZoneWeather(zones, signal).then(
        (byZone) => setState({ status: "ready", byZone }),
        () => {
          // Keep the last good reading if a background refresh fails.
          if (!signal.aborted) {
            setState((prev) => (prev.status === "ready" ? prev : { status: "error" }));
          }
        },
      );
    }

    load();
    const interval = window.setInterval(load, REFRESH_MS);
    return () => {
      window.clearInterval(interval);
      controller.abort();
    };
  }, [zones]);

  return state;
}
