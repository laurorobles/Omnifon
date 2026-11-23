# Omnifón virtual

Reconstrucción web interactiva del **Omnifón**, el primer sintetizador diseñado y construido en México, creado por el ingeniero y compositor **Raúl Pavón Sarrelangue** (c. 1960–1964).

> [!NOTE]
> Es una **reconstrucción históricamente informada**, no una emulación de circuito: no existen esquemáticos, listas de materiales ni grabaciones certificadas del prototipo. Cada decisión que suple un vacío documental está marcada abajo.

## Modo dual

| Modo | Base histórica | Qué incluye |
|---|---|---|
| **Prototipo 1960–64** | Descripciones de Pavón y fuentes secundarias | VCO (senoidal, cuadrada, rampa) de 10 Hz a 20 kHz, ruido blanco, filtro por voltaje, envolvente, amplificador y teclado |
| **Estudio 1981** | «Sintetizador ideal — Omnifón», cap. IV de *La electrónica en la música… y en el arte* (CENIDIM, 1981) | Todo lo anterior + oscilador 2 como modulador (tono, filtro, amplitud) |

## Qué está documentado y qué es una decisión de diseño

| Elemento | Documentado | Decisión DSP en esta versión |
|---|---|---|
| Rango del VCO | 10 Hz – 20 kHz, continuo | Barrido logarítmico; seguimiento de teclado conmutable (Libre / Teclado) |
| Formas de onda | Senoidal, cuadrada, rampa | Senoidal en doble precisión; cuadrada y rampa con PolyBLEP |
| Ruido | Ruido blanco | xoshiro128** (espectro plano) |
| Filtro | «Filtro por voltaje» (Fig. IV.25) | SVF de retardo cero, bajos/banda/altos, 12 o 24 dB/oct (**pendiente no documentada**) |
| Envolvente | Existe; control externo del total (1981) | Exponencial tipo RC, AR o ADSR (**etapas no documentadas**) |
| Polifonía | No explícita | Monofónico con prioridad a la última nota |
| Escala de CV | No documentada | Interna en octavas (equivalente a 1 V/oct) |
| Tolerancia analógica | — | Deriva lenta opcional, **0 % por defecto** (Pavón destacaba la pureza de onda) |

## Desarrollo

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # genera dist/
```

Controles: arrastra las perillas en vertical (Shift = ajuste fino, doble clic = valor inicial, rueda del ratón). Toca con el ratón, con las teclas `A`–`Ñ` (`Z`/`X` cambian de octava) o con un controlador MIDI.

### Estructura

```
src/
  engine/params.ts            definición única de parámetros (DSP + UI)
  engine/omnifon-processor.ts motor DSP por muestra (AudioWorklet)
  engine.ts                   puente UI ↔ AudioWorklet
  ui/                         perillas, conmutadores, teclado, osciloscopio
```

El motor está escrito sin dependencias para portarlo después a C++ (JUCE) como plugin VST3/AU.

## Hoja de ruta

- [x] v0.1 — Cadena monofónica Prototipo + modulador Estudio, osciloscopio, teclado de 5 octavas, MIDI
- [ ] Consola de mezcla y control (10 entradas de audio + 10 de CV) con matriz de conexiones
- [ ] Módulo de grabación/edición: cinta y bucles sin clics (homenaje al teclado de cintas de 1958)
- [ ] Osciloscopio X-Y y modo cromático *Icofón*
- [ ] Presets históricos y GUI basada en fotografías de archivo
- [ ] Port a plugin VST3/AU

## Fuentes

- Raúl Pavón, *La electrónica en la música… y en el arte*, SEP / INBA-CENIDIM, 1981, cap. IV (pp. 170–204).
- Ricardo Dal Farra, tesis doctoral, UQAM, 2006 (fig. 23) — https://archipel.uqam.ca/2062/1/D1367.pdf
- Martín Matus Lerner, *Latin American NIMEs*, NIME 2019 — https://nime.org/proceedings/2019/nime2019_paper044.pdf
- *Sul Ponticello* — Dispositivos sonoros experimentales y luthería electrónica en América Latina
- Manuel Rocha Iturbide, *La música electroacústica en México* — https://www.artesonoro.net/electroacustica/electromex.html
