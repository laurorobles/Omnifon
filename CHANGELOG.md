# Changelog

Todos los cambios notables de este proyecto se documentan en este archivo.

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
