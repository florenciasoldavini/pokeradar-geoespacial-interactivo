"use client"; // Uses the device key styles, which live in a client module.

import Link from "next/link";
import { DeviceMessage } from "@/components/device/device-message";
import { GREEN_KEY } from "@/components/device/parts";

export default function NotFound() {
  return (
    <DeviceMessage
      code="Error 404"
      title="Acá no hay ningún Pokémon"
      body="Esta página no existe. El radar sigue en el mapa de Argentina."
      action={
        <Link href="/" className={`${GREEN_KEY} dex-font-display inline-block rounded-xl px-5 py-2.5 text-sm font-bold`}>
          Volver al radar
        </Link>
      }
    />
  );
}
