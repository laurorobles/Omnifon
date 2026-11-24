# Changelog

Todos los cambios notables de este proyecto se documentan en este archivo.

## [1.4.0] — 2026-11-24

### Lanzamiento oficial del Plugin Nativo VST3 / AU / Standalone + DAW Sync
- **Plugin nativo multi-formato (`vst/`):** Motor DSP C++20 completo de los 14 módulos con **JUCE 8**, compilado en **VST3**, **Audio Unit (AU)** y **Standalone** para macOS (Apple Silicon).
- **Interfaz 100% idéntica a la versión web:** Incrustada mediante `juce::WebBrowserComponent` (`BinaryData`) con todos los módulos, perillas SVG estriadas, cables Bézier arrastrables, Manual Ilustrado, Información histórica (Fig. IV.38), enlaces y selector `ES / EN`.
- **Sincronización con el DAW (`DAW SYNC`):** Enganche al BPM y posición PPQ del host, subdivisiones rítmicas (`1/1` a `1/32` con tresillos) y seguimiento de `TRANSPORT` (Play/Stop + reinicio del secuenciador al Paso 1).
- **Teclado MIDI ocultable:** Botón `Teclado` en la barra superior para mostrar u ocultar el teclado de 5 octavas en web y en el plugin.
- **Descarga directa desde el sitio web:** Botón `VST / AU` en la barra superior apuntando al último release oficial.
- **Crédito en pie de página:** Enlace a `@extasisrecords` al fondo del instrumento.

## [1.3.0] — 2026-11-24

### Manual de usuario interactivo ilustrado, botón a GitHub y hoja de ruta VST
- **Manual de usuario ilustrado e interactivo en la aplicación web:**
  - Botón de acceso directo en la barra superior con icono de libro para consultar el manual sin salir del instrumento.
  - Fotografía frontal del sintetizador físico original de Raúl Pavón (CENIDIM, México) para comparación visual directa contra la reconstrucción virtual.
  - 5 secciones pedagógicas detalladas: Inicio rápido, Gestos y cables, Referencia visual de los 14 módulos, Banco de los 8 parches y Hoja de ruta VST.
  - Soporte bilingüe completo (Español e Inglés) sincronizado con el interruptor `ES/EN`.
- **Botón elegante y discreto a GitHub:**
  - Enlace directo al repositorio oficial `https://github.com/laurorobles/Omnifon` con logotipo vectorial SVG en la barra superior.
- **Hoja de ruta y plan de trabajo para port VST (`docs/ROADMAP_VST.md`):**
  - Plan de 5 fases para portar el motor DSP a formatos nativos de plugin VST3, AU, CLAP y Standalone usando C++20 y JUCE 8.
  - Mapeo directo entre los 14 AudioWorkletProcessors y clases DSP C++.
- **Actualización ilustrada del manual en repositorio (`docs/MANUAL.md`):**
  - Diagramas ASCII del gabinete y flujo de señal analógica, fotos históricas y enlaces cruzados.

## [1.2.0] — 2026-11-24

### Revisión ortográfica integral, proporciones físicas y banco de 8 parches
- **Ortografía verificada en las 14 placas:** Revisión completa contra el libro original de Raúl Pavón (1981) en español e inglés (`Salidas` en `Aleator` y `Reverberal`, `intensidad` y `tiempo` en `Reverberal`, `ataque` / `duración` / `decaimiento` en `Integrador Envolv.`, `Entradas` / `Salida` / `pulsos` / `reinicio` / `voltaje` en `Secuenciador`, y conmutador funcional `dir. / rec.` en `Oscilador`).
- **Ajuste de proporciones y tamaños físicos:** Gabinete calibrado a proporción clásica de estudio (`1220 px`), perillas de mayor diámetro y legibilidad, matriz `3 × 10` de perillas limpias sin marcas radiales exteriores en el `Secuenciador`, y alineación axial de conectores y trazos en todos los módulos.
- **Banco de 8 parches musicales y experimentales** (con **`1 · Fig. IV.38`** siempre al inicio + descripción activa en pantalla y botón independiente **`Sin cables`**): `1 · Fig. IV.38`, `2 · Teclado`, `3 · Bajo 8p`, `4 · Campanas`, `5 · Aleatorio`, `6 · Formantes`, `7 · Percusión` y `8 · Cosmos`.

## [1.1.0] — 2026-11-24

### Adecuación 1:1 a los paneles del aparato original
- Reconstrucción exacta de los controles, conectores, conmutadores, deslizadores y trazos serigrafiados de los 12 módulos superiores respecto al gabinete físico original:
  - **`Envolvedor`:** 2 entradas acopladas a sus perillas escalonadas `mín.–máx.` y doble salida vertical en paralelo.
  - **`Aleator` y `Ruidor`:** Módulos calibrados sin perillas, fieles a la placa física original.
  - **`Mod. Anular`:** 3 entradas a la izquierda, perilla central `mín.–máx.` y par de salidas en paralelo.
  - **`Integrador Envolv.`:** Topología original de 3 etapas (`ataque`, `duración`, `decaimiento` `5ms.–5seg.`), conmutador deslizante `ext. / int.` (permite autociclado) y pulsador metálico manual.
  - **`Oscilador` (×2):** Perilla blanca `frecuencia` (`5hz–20khz.`), `aj. fino` enlazado verticalmente, 4 salidas con símbolos de onda (`∿`, `∧`, `⩘`, `⊓`), `ancho` (`⊔–⊓`) a la derecha y `modular en frec.` blanco abajo.
  - **`Filtro-V`:** Perilla oscura `ancho`, deslizador horizontal `Corte`, perilla blanca `Centro` (`5Hz–15kHz`), deslizador horizontal `modulación` y salidas `baj.`, `alt.` y `banda`.
  - **`Filtro-O`:** Deslizador vertical `Corte` a la izquierda, 10 deslizadores horizontales (`25 Hz – 13 kHz`) y `Suma`.
  - **`Pulsador`:** Entradas `inicio` y `fin` enlazadas a pulsadores metálicos de arranque/paro, perillas `Pulsos` (`0–100`) y `reloj` blanca, y bus vertical de 3 salidas.
  - **`Secuenciador`:** Salidas por fila a la izquierda, 10 conectores superiores de pulso por paso (permitiendo puentear cualquier paso a `reinicio` para fijar la longitud del ciclo, tal como en la *Figura IV.38*) y 10 conmutadores inferiores de activación por paso.

## [1.0.0] — 2026-11-23

Primera versión pública completa del **Omnifón Virtual**.

### Agregado
- **Gabinete modular completo (14 módulos DSP independientes en `AudioWorklet`):**
  - `Envolvedor`, `Aleator`, `Mod. Anular`, `Ruidor`, `Reverberal`, `Integrador Envolv.`, `Oscilador 1`, `Oscilador 2`, `Filtro-V`, `Filtro-O` (banco de 10 octavas `25 Hz – 15 kHz`), `Pulsador`, `Secuenciador` (`3 × 10` pasos), `Teclado` (`5 octavas` + Web MIDI) y `Salida` estéreo con osciloscopio de fósforo verde.
- **Sistema de parcheo con cables virtuales en tiempo real** a frecuencia de audio (caída catenaria en SVG y modo *Atenuar cables*).
- **Perillas vectoriales estriadas mate** (negras estándar y blancas en controles maestros de `Frecuencia` y `Centro`).
- **5 Presets incluidos**, encabezados por **`Fig. IV.38`** (recreación fiel del ejemplo de alambrado documentado en el libro de Raúl Pavón Sarrelangue de 1981), seguido de `Teclado`, `Secuencia`, `Cósmico` y `Vacío`.
- **Interfaz bilingüe (`ES` / `EN`)** con Español por defecto y cambio dinámico sin interrumpir el audio.
- **Ventana histórica interactiva** con la lámina original *Figura IV.38* integrada y cronología documentada del instrumento.
- **Documentación completa del repositorio:** `docs/INVESTIGACION.md`, `docs/MANUAL.md`, `docs/ARCHITECTURE.md`, `CITATION.cff`, `LICENSE` (MIT) y metadatos SEO / Open Graph / Schema.org.

## [0.2.0] — 2026-11-23
- Migración de arquitectura fija a gabinete modular completo con cables arrastrables.

## [0.1.0] — 2026-11-23
- Prototipo inicial monofónico en Web Audio (`AudioWorklet`) con modo dual Prototipo / Estudio.
