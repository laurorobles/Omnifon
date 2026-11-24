# OMNIFÓN · Sintetizador Modular Virtual

[![Probar en línea](https://img.shields.io/badge/Probar_en_l%C3%ADnea-GitHub_Pages-2ea44f?style=for-the-badge)](https://laurorobles.github.io/Omnifon/)
[![Release](https://img.shields.io/badge/Versi%C3%B3n-v1.0.0-1f6feb?style=for-the-badge)](https://github.com/laurorobles/Omnifon/releases)
[![Licencia: MIT](https://img.shields.io/badge/Licencia-MIT-d29922?style=for-the-badge)](./LICENSE)

**Reconstrucción web modular e interactiva del Omnifón**, reconocido como el **primer sintetizador analógico controlado por voltaje diseñado y construido en México**, obra del ingeniero electricista, pionero del cómputo y compositor **Raúl Pavón Sarrelangue** (c. 1960–1964 / sistematizado en 1981).

Creado por **[@laurorobles](https://www.instagram.com/laurorobles/)** · **[Abrir el instrumento en vivo →](https://laurorobles.github.io/Omnifon/)**

*([Read in English below ↓](#english-overview))*

![Gabinete modular del Omnifón Virtual](./docs/images/omnifon-screenshot.png)

> [!NOTE]
> **Transparencia histórica:** Debido a que el Omnifón nunca se fabricó comercialmente, no existen esquemáticos electrónicos de circuito ni grabaciones secas certificadas en fuentes abiertas. Este proyecto es una **reconstrucción históricamente informada en DSP** (`Web Audio API` / `AudioWorklet`) basada en las descripciones técnicas, diagramas de paneles y láminas publicadas por el propio Raúl Pavón en *La electrónica en la música… y en el arte* (SEP / INBA-CENIDIM, 1981). Consulta el detalle completo en **[`docs/INVESTIGACION.md`](./docs/INVESTIGACION.md)**.

---

## Características principales

- **14 módulos DSP independientes a frecuencia de audio:** Cada panel del gabinete corre en su propio `AudioWorkletProcessor`, permitiendo modulación real muestra por muestra (FM, modulación anular, filtrado controlado por voltaje y secuencias analógicas).
- **Parcheo con cables virtuales en tiempo real:** Conecta y desconecta cualquier salida con cualquier entrada arrastrando con el ratón o pantalla táctil, con modo **Atenuar cables** para operar cómodamente los controles.
- **Preset documental *Figura IV.38* incluido por defecto:** Recrea el ejemplo de alambrado original publicado por Raúl Pavón en su libro de 1981 (secuencia melódica con modulación anular por el banco de octavas + segunda voz de ruido rosa con filtrado programado).
- **Interfaz bilingüe (`ES` / `EN`):** Español por defecto con traducción instantánea al inglés de todos los paneles, controles, presets y documentación histórica integrada.
- **Teclado de 5 octavas + soporte Web MIDI:** Toca con el ratón (con glissando), el teclado de tu computadora (`A`–`Ñ`, `Z`/`X` para octavas) o cualquier controlador MIDI USB.

---

## Módulos del gabinete

| Ubicación | Módulo | Descripción |
|---|---|---|
| **Fila 1** | **Envolvedor** | Amplificador controlado por voltaje (VCA) con nivel mínimo/máximo y salida doble |
| **Fila 1** | **Aleator** | Generador aleatorio (*Sample & Hold*) con reloj interno/externo y salidas `Escalón` y `Suave` |
| **Fila 1** | **Mod. Anular** | Modulador en anillo de 4 cuadrantes con portadora senoidal interna o externa |
| **Fila 1** | **Ruidor** | Generador de ruido `Blanco` y `Rosa` (`−3 dB/oct`) |
| **Fila 1** | **Reverberal** | Reverberador de estudio con doble entrada sumadora, mezcla y decaimiento |
| **Fila 2** | **Integrador Envolv.** | Generador de envolvente exponencial ADSR con salidas directa/inversa y botón manual `Pulso` |
| **Fila 2** | **Oscilador 1 y 2** | Dos VCOs continuos (`5 Hz – 20 kHz`) con ondas senoidal, triangular, rampa y cuadrada (PolyBLEP + PWM + FM) |
| **Fila 2** | **Filtro-V** | Filtro controlado por voltaje sin retardo (ZDF-SVF) con salidas simultáneas `Bajos`, `Banda` y `Altos` |
| **Fila 2** | **Filtro-O** | Banco gráfico de 10 filtros de octava (`25 Hz – 15 kHz`) con 10 salidas individuales + `Suma` |
| **Fila 3** | **Pulsador** | Reloj maestro de pulsos (`0.1 – 40 Hz`) con arranque/paro externo, botón `Marcha` y salidas en fase/inversa |
| **Fila 3** | **Secuenciador** | Matriz analógica de `3 × 10` pasos con LEDs activos, longitud ajustable (`1–10`) y cuantización cromática |
| **Consola** | **Teclado + Salida** | Teclado de 61 teclas (`Voltaje` + `Pulso`, portamento, MIDI) y etapa estéreo con osciloscopio de fósforo verde |

---

## Documentación del proyecto

| Documento | Contenido |
|---|---|
| **[Investigación Histórica (`docs/INVESTIGACION.md`)](./docs/INVESTIGACION.md)** | Biografía técnica de Raúl Pavón Sarrelangue, debate de fechamiento (1960 vs. 1964), deslinde del *Icofón*, análisis de la *Figura IV.38*, vacíos documentales y bibliografía académica. |
| **[Manual de Usuario (`docs/MANUAL.md`)](./docs/MANUAL.md)** | Guía completa de gestos, atajos de teclado, Web MIDI, referencia detallada de los 14 módulos y recetas paso a paso para crear parches desde cero. |
| **[Arquitectura y DSP (`docs/ARCHITECTURE.md`)](./docs/ARCHITECTURE.md)** | Diagrama del sistema, grafo de `AudioWorkletNodes`, algoritmos DSP módulo por módulo y guía de portabilidad a C++ / JUCE (VST3 / AU). |
| **[Historial de versiones (`CHANGELOG.md`)](./CHANGELOG.md)** | Registro de cambios por versión. |

---

## Instalación y desarrollo local

Requiere **Node.js 20+**:

```bash
git clone https://github.com/laurorobles/Omnifon.git
cd Omnifon
npm install
npm run dev      # Inicia servidor de desarrollo en http://localhost:5173
npm run build    # Compila TypeScript y genera el paquete estático en dist/
```

---

## English Overview

**Omnifón Virtual** is an interactive, browser-based modular reconstruction of the **Omnifón**—recognized as the **first analog voltage-controlled synthesizer designed and built in Mexico**, created by electrical/computing pioneer and composer **Raúl Pavón Sarrelangue** (c. 1960–1964, expanded and documented in his 1981 CENIDIM book *La electrónica en la música… y en el arte*).

- **Play it live in your browser:** https://laurorobles.github.io/Omnifon/ (click **`EN`** in the top-right bar to switch the entire interface and historical guide to English).
- **Real-time modular audio engine:** 14 independent `AudioWorkletProcessor` modules patched at audio rate with virtual catenary cables, zero runtime dependencies, 5-octave keyboard, and **Web MIDI** support.
- **Default historical patch (`Fig. IV.38`):** Recreates the original wiring example published in Pavón’s 1981 book, pairing a 5-step ring-modulated melodic sequence routed through the 10-band octave filter bank with a second voice of sequencer-modulated bandpass pink noise.

---

## Cómo citar / Citation

Si utilizas este instrumento virtual o su documentación en investigación académica, docencia o producción artística, puedes usar el botón **"Cite this repository"** en la barra lateral de GitHub (generado desde [`CITATION.cff`](./CITATION.cff)) o la siguiente referencia:

> Robles, L. (`@laurorobles`). (2026). *Omnifón Virtual: Reconstrucción modular interactiva del primer sintetizador mexicano de Raúl Pavón Sarrelangue* (v1.0.0) [Software]. https://github.com/laurorobles/Omnifon

---

## Créditos y licencia

- **Investigación, diseño e implementación virtual:** Lauro Robles ([@laurorobles](https://www.instagram.com/laurorobles/))
- **Instrumento original y documentación primaria:** Ing. Raúl Pavón Sarrelangue (1927–2008), *La electrónica en la música… y en el arte* (SEP / INBA-CENIDIM, México, 1981).
- **Licencia:** Distribuido bajo la licencia [MIT](./LICENSE).
