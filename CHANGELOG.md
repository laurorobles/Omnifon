# Changelog

Todos los cambios notables de este proyecto se documentan en este archivo.

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
