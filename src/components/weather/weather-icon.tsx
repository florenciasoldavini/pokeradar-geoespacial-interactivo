import type { WeatherKind } from "@/lib/weather";

const CLOUD = "M7 19h10a4 4 0 0 0 .5-7.97A6 6 0 0 0 6.1 12.1 3.5 3.5 0 0 0 7 19z";
const CLOUD_HIGH = "M7 15h10a4 4 0 0 0 .5-7.97A6 6 0 0 0 6.1 8.1 3.5 3.5 0 0 0 7 15z";

type WeatherIconProps = {
  kind: WeatherKind;
  isDay?: boolean;
  className?: string;
};

/** Line icons drawn with currentColor, so they inherit the text color. */
export function WeatherIcon({ kind, isDay = true, className }: WeatherIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {kind === "clear" &&
        (isDay ? (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
          </>
        ) : (
          <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />
        ))}
      {kind === "partly-cloudy" && (
        <>
          <path d="M8 3v1.5M3.5 8H5M4.8 4.8l1 1M11.2 4.8l-1 1" />
          <path d="M5.5 10.5a3 3 0 0 1 5-2.6" />
          <path d={CLOUD} />
        </>
      )}
      {kind === "cloudy" && <path d={CLOUD} />}
      {kind === "rain" && (
        <>
          <path d={CLOUD_HIGH} />
          <path d="M8 18l-1 3M12 18l-1 3M16 18l-1 3" />
        </>
      )}
      {kind === "snow" && (
        <>
          <path d={CLOUD_HIGH} />
          <path d="M8 19h.01M12 18h.01M16 19h.01M10 21.5h.01M14 21.5h.01" strokeWidth={2.6} />
        </>
      )}
      {kind === "fog" && <path d="M4 8h16M3 12h18M5 16h14M8 20h8" />}
      {kind === "windy" && (
        <path d="M3 8h10a3 3 0 1 0-3-3M3 12h15a3 3 0 1 1-3 3M3 16h7" />
      )}
    </svg>
  );
}
