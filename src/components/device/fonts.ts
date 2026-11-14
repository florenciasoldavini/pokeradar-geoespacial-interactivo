import { Chakra_Petch, Share_Tech_Mono } from "next/font/google";

/** Engraved plastic: brand, key legends and module labels. */
export const dexDisplay = Chakra_Petch({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-dex-display",
});

/** Segment-style LCD readouts. */
export const dexLcd = Share_Tech_Mono({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-dex-lcd",
});
