import type { ReactNode } from "react";
import { dexDisplay, dexLcd } from "@/components/device/fonts";
import { Lens } from "@/components/device/hardware";
import "@/components/device/device.css";

type DeviceMessageProps = {
  /** LCD line, e.g. "Error 404". */
  code: string;
  title: string;
  body: string;
  /** The one way out: a link or a retry key. */
  action: ReactNode;
};

/** A full-screen message on the Pokédex shell, for the 404 and error pages. */
export function DeviceMessage({ code, title, body, action }: DeviceMessageProps) {
  return (
    <main
      className={`pokedex ${dexDisplay.variable} ${dexLcd.variable} grid h-dvh place-items-center p-4 text-center`}
    >
      <div className="bz-bezel w-full max-w-sm rounded-[20px] p-2">
        <div className="dex-lcd flex flex-col items-center gap-3 rounded-[14px] px-6 py-8">
          <Lens active={false} />
          <p className="dex-font-lcd dex-lcd-text text-xs uppercase">{code}</p>
          <h1 className="dex-font-display text-2xl font-bold tracking-tight text-white">{title}</h1>
          <p className="text-sm text-white/70">{body}</p>
          <div className="mt-2">{action}</div>
        </div>
      </div>
    </main>
  );
}
