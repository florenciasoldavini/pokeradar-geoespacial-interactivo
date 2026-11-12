# PokéRadar · Argentina

Un radar geoespacial para descubrir Pokémon recorriendo los biomas reales de Argentina. Cada zona del mapa representa un hábitat de la PokéAPI, y el **clima en vivo** de ese lugar decide qué tipos se potencian y qué visitantes aparecen.

**Demo:** https://pokeradar-geoespacial-interactivo.vercel.app · **Stack:** Next.js 16 (App Router) · TypeScript estricto · Tailwind CSS v4 · MapLibre GL + OpenFreeMap · Framer Motion · PokéAPI · Open-Meteo

---

## 1. Concepto y narrativa

La PokéAPI no tiene ubicaciones reales, pero sí tiene **hábitats** (`cave`, `forest`, `sea`, `urban`…). La idea fue darles un lugar concreto en el mapa argentino, de modo que la distribución de los Pokémon tenga una lógica que se entienda sin explicación:

| Hábitat PokéAPI | Zona | Por qué |
|---|---|---|
| `urban` | Buenos Aires | El hábitat urbano por excelencia |
| `grassland` | Llanura Pampeana | Pastizales infinitos |
| `waters-edge` | Cataratas del Iguazú | 275 saltos de agua y selva |
| `mountain` | Aconcagua | El techo de América |
| `rough-terrain` | Quebrada de Humahuaca | Cerros y piedra suelta |
| `rare` | Valle de la Luna (Ischigualasto) | Fósiles de 230 M de años → acá viven los legendarios |
| `forest` | Bosque Andino Patagónico | El bosque más denso del sur |
| `sea` | Península Valdés | Ballenas y Atlántico abierto |
| `cave` | Cueva de las Manos | Arte rupestre en un cañadón |

Encima de esa capa fija hay una **capa viva: el clima real** de cada zona (Open-Meteo). Uso la regla de *weather boost* de Pokémon GO porque los jugadores ya la conocen (y cubre los ejemplos del desafío: lluvia → Agua/Eléctrico, nieve → Hielo, sol → Fuego):

- Los Pokémon cuyo tipo favorece el clima actual aparecen **potenciados** (aura + ícono del clima).
- Cada zona recibe un **visitante**: un Pokémon que no vive en ese hábitat y sólo aparece con ese clima.
- El clima **sólo suma**, nunca saca Pokémon: así nada salta en el mapa cuando llega el pronóstico.

**Recorrido de la experiencia**

1. Vista país: 9 zonas con un pulso de radar y el clima en vivo en cada etiqueta.
2. Al elegir una zona, la cámara vuela (con inclinación 3D), se despliega un **radar pintado sobre el terreno** y los Pokémon "aparecen" uno a uno.
3. Al elegir un Pokémon, se abre un panel con datos reales de la PokéAPI en español (nombre, categoría, descripción de la Pokédex, estadísticas animadas, habilidades).
4. Se puede **capturar** hasta 6 Pokémon en el *Equipo de expedición* (se guarda entre visitas); al tocar uno, el mapa te lleva de vuelta adonde lo encontraste.
5. Los **filtros** (tipo, generación, total de estadísticas) responden tanto a nivel país —cada zona muestra cuántos Pokémon coinciden— como dentro de una zona.

**Decisiones de UX**

- `Esc` retrocede un nivel (filtros → Pokémon → zona → país).
- Usuarios con *reducir movimiento* activado reciben saltos de cámara en lugar de vuelos y un radar estático.
- El grito del Pokémon suena **al capturarlo** (y a demanda desde el panel). Al principio sonaba cada vez que se seleccionaba uno; al probarlo resultó molesto y lo moví al momento de la captura, donde funciona como recompensa.
- Mobile: el panel de detalle es una *bottom sheet* que se cierra arrastrándola hacia abajo; en desktop es un panel lateral y la cámara deja espacio para que no tape al Pokémon.

---

## 2. Arquitectura y stack

| Pieza | Elección | Motivo |
|---|---|---|
| Framework | **Next.js 16 (App Router)** con *Cache Components* | Separación clara server/client y prerender con datos cacheados |
| Mapa | **MapLibre GL 6 + OpenFreeMap** (`dark`, re-teñido) | Tiles vectoriales sin API key, `flyTo` nativo con pitch/bearing |
| Animación | **Framer Motion** | Springs, `AnimatePresence`, drag de la bottom sheet |
| Estilos | **Tailwind CSS v4** | Tokens de diseño en `@theme` (`radar`, `radar-bg`, `panel`) |
| Datos | **PokéAPI** + **Open-Meteo** | Gratuitas, sin key |

TypeScript con `strict`, `noUncheckedIndexedAccess` y `noImplicitOverride`; sin `any` en el código.

### Qué corre en el servidor y qué en el cliente

```
page.tsx (Server Component)
├─ getZoneSpawns()        'use cache' · 1 día  → 8 Pokémon por hábitat, con posición
├─ getWeatherVisitors()   'use cache' · 1 día  → candidatos por tipo de clima
└─ <RadarApp> (Client)    recibe datos planos y maneja toda la interacción
   ├─ useZoneWeather()    Open-Meteo, 1 request para las 9 zonas, refresco c/15 min
   ├─ applyWeather()      función pura: hábitat + clima → lo que muestra el radar
   ├─ <MapLoader>         next/dynamic con ssr:false → <MapView> (todo lo que toca maplibre-gl)
   └─ <PokemonDrawer>     usePokemonDetail(): fetch a PokéAPI al seleccionar, con cache y reintento
```

- La página sale **estática** (revalida cada 24 h): las ~140 requests a la PokéAPI ocurren en build/revalidación, nunca mientras el usuario espera. Si un hábitat falla, esa zona muestra "Sin señal" y el resto sigue andando.
- El **detalle** sí se pide en el cliente al seleccionar (con *skeletons* que replican el layout final, estado de error con reintento y cache en memoria).
- El **clima** se pide en el cliente porque es en vivo; si falla, el radar funciona sin bonificaciones.
- `src/server/*` importa `server-only`: si algún componente cliente lo importara, el build falla.

### Carpetas

```
src/
├─ app/                 layout, page (server), error boundary, icono
├─ components/
│  ├─ map/              todo lo que usa maplibre-gl (cargado sólo en cliente)
│  ├─ pokemon/          drawer de detalle, barras de stats, badges de tipo
│  ├─ radar/            shell de la app, tarjeta de zona, filtros, equipo, sonido
│  ├─ weather/          íconos de clima
│  └─ ui/               íconos y slider de rango accesible
├─ hooks/               detalle, clima, equipo (localStorage), media queries…
├─ lib/                 dominio puro y compartido: zonas, clima, filtros, layout de spawns
│  └─ pokeapi/          fetch tipado + tipos de las respuestas usadas
└─ server/              data fetching cacheado (server-only)
scripts/
└─ copy-maplibre-worker.mjs   ver "Uso de IA", punto 1
```

### Detalles técnicos que valen la pena

- **Marcadores React sobre MapLibre:** `MapMarker` crea el `<div>` que MapLibre posiciona y React renderiza adentro con un portal, así los marcadores son componentes animables con Framer Motion.
- **Radar en perspectiva real:** el radar es un `canvas` dibujado cuadro a cuadro y agregado como *canvas source* de MapLibre, así el motor lo proyecta sobre el terreno con la misma perspectiva que las calles.
- **Spawns deterministas:** semilla por zona (PRNG `mulberry32`) + layout de girasol (ángulo áureo) para que no se superpongan y siempre estén en el mismo lugar.
- **Cámara declarativa:** `CameraController` traduce el estado de React a `flyTo` / `fitBounds`, depende de primitivos (no de objetos) para no relanzar vuelos en cada render, y reserva espacio para el panel abierto.

### Correr localmente

```bash
pnpm install
pnpm dev     # copia el worker de MapLibre a /public y levanta Next en :3000
pnpm build   # build de producción (hace las requests a PokéAPI)
pnpm lint
```

---

## 3. Uso de Inteligencia Artificial (AI-Native Workflow)

**Herramienta:** Claude Code (modelo Claude Opus 5.5), usado como par de programación dentro del editor.

**Cómo trabajé:** dividí el desafío en 5 etapas (mapa → datos y detalle → clima → extras → README/deploy). Después de cada una la IA se detenía, yo levantaba la app, la probaba en el navegador (desktop y mobile) y recién entonces seguíamos. Las decisiones de producto (concepto de biomas + clima, extras, cuándo suena el grito) las tomé yo; la IA proponía opciones y escribía la mayor parte del código. También le pedí que verificara las APIs contra la documentación instalada en `node_modules` (Next 16 y MapLibre 6 son más nuevos que lo que "recuerda" un modelo) y contra respuestas reales de las APIs.

### Errores que encontré probando la app

1. **El mapa no aparecía (worker de MapLibre).** El build y el chequeo de tipos pasaban, pero en el navegador la consola mostraba `Worker failed to load`. MapLibre 6 carga su Web Worker con una URL relativa a su propio módulo, y al bundlear con Turbopack ese archivo no existe → Next devolvía su 404 en HTML. Solución: un script copia el worker a `/public` en cada `dev`/`build` y se configura con `setWorkerUrl`. *Lección: "compila" no significa "funciona"; en una app de mapas hay que mirarla.*
2. **El mapa seguía en negro (conflicto de CSS).** MapLibre agrega `.maplibregl-map { position: relative }` sin *cascade layer*, y en Tailwind v4 las utilidades viven en `@layer utilities`, así que la regla de MapLibre le ganaba a mi `absolute inset-0` y el contenedor quedaba con 0 px de alto. Solución: el posicionamiento va en un wrapper que MapLibre no toca.
3. **El radar no cubría a los Pokémon al hacer zoom.** La IA lo había hecho como un elemento DOM de tamaño fijo en píxeles, mientras que los Pokémon están en coordenadas geográficas. Primero lo escaló según el zoom.
4. **…y seguía fallando al arrastrar el mapa.** Con el mapa inclinado, el suelo lejano (arriba de la pantalla) se ve más chico y el cercano más grande; un marcador DOM se inclina pero no recibe esa perspectiva. Identifiqué que el problema aparecía al **arrastrar**, no al hacer zoom, y eso llevó a la solución correcta: dibujar el radar *dentro* del mapa como canvas source. Fue el mejor ejemplo de algo que "se veía bien" en el caso por defecto y estaba conceptualmente mal.
5. **El slider de rango doble no dejaba mover el control izquierdo.** La IA usó el truco común de dos `<input type="range">` superpuestos, que depende de `pointer-events` en `::-webkit-slider-thumb`; en Chrome el input de arriba se quedaba con todos los clicks. Lo reemplazamos por un slider propio (agarra el control más cercano, *pointer capture*, `role="slider"` con teclado).
6. **UX:** pedí que el panel de filtros tuviera botón de cerrar y se cerrara al abrir un Pokémon, y saqué el sonido automático al seleccionar (ver Decisiones de UX).

### Errores que la IA detectó y corrigió verificando

- **API de Next 16:** usar `dynamic(..., { ssr: false })` directamente en `page.tsx` (un Server Component, como sugiere el snippet del desafío) da error en Next 16; tiene que vivir en un archivo `"use client"`. También, `error.tsx` en Next 16 recibe `retry` (no `reset`) y `error: unknown`.
- **MapLibre 6** no tiene *default export*: el clásico `import maplibregl from "maplibre-gl"` no funciona.
- **Datos reales:** Deoxys llegaba como `deoxys-normal` (nombre de la forma, no de la especie); se detectó leyendo la respuesta real de la API.
- **Lint (reglas del React Compiler):** detectó la mutación de un elemento DOM guardado en `useState` dentro de un efecto, y un `useMemo` que se invalidaba en cada render.
- **Framer Motion:** un `delay` negativo (idiom de CSS, no confiable en Framer), un `delay` que sólo afectaba la opacidad (la animación de escala terminaba invisible) y un `exit` que nunca podía correr porque no había `AnimatePresence`.
- **Visual (a partir de mis capturas):** los marcadores de zona estaban desplazados ~70 km porque MapLibre centraba también la etiqueta, y el estilo oscuro tenía el agua casi del mismo color que la tierra (el Río de la Plata desaparecía).

### Pendiente de decisión

Con la regla de Pokémon GO, el Aconcagua a −12 °C cuenta como "despejado" y potencia a **Fuego**. Es correcto según la regla, pero raro en la narrativa; lo dejé así y lo anoto en próximos pasos.

---

## 4. Próximos pasos (con una semana más)

**Producto**
- **Reglas de clima propias:** temperatura además del cielo (≤ −5 °C → Hielo/Acero), y noche → Siniestro/Fantasma.
- **Más zonas:** Glaciar Perito Moreno, Ushuaia, Talampaya, Esteros del Iberá; *clustering* o niveles de detalle si crece la cantidad de spawns.
- **Links compartibles:** zona y Pokémon en la URL (`?zona=iguazu&pokemon=54`) para compartir un hallazgo.
- **Rotación diaria** de spawns (semilla por fecha) para dar motivos de volver.
- En el detalle: cadena evolutiva y debilidades por tipo; en el equipo, un resumen de cobertura de tipos.

**Técnico**
- **Tests:** unitarios para la lógica pura (`classifyWeather`, `applyWeather`, `matchesFilters`, `spawnPosition`) y e2e con Playwright para los flujos principales (zona → Pokémon → captura).
- **Validación en runtime** de las respuestas externas (p. ej. Zod) en lugar de confiar en los tipos.
- **Rendimiento:** pausar la animación del radar cuando la pestaña no está visible; medir el costo del canvas source en mobile de gama baja.
- **Accesibilidad del mapa:** navegación por teclado entre marcadores con flechas y anuncio de la zona actual.
- **PWA / offline:** cachear sprites y la última lectura del clima.
