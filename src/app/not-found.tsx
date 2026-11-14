import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid h-dvh place-items-center bg-radar-bg p-6 text-center">
      <div className="max-w-sm">
        <div className="mx-auto grid size-20 place-items-center rounded-full border border-radar/30">
          <span className="size-3 rounded-full bg-radar shadow-[0_0_16px] shadow-radar" />
        </div>
        <p className="mt-6 font-mono text-[11px] tracking-wider text-radar uppercase">Error 404</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Acá no hay ningún Pokémon</h1>
        <p className="mt-2 text-sm text-white/60">Esta página no existe. El radar sigue en el mapa de Argentina.</p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-full bg-radar px-5 py-2 text-sm font-semibold text-radar-bg transition-opacity hover:opacity-90"
        >
          Volver al radar
        </Link>
      </div>
    </main>
  );
}
