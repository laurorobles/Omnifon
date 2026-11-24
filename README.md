# Omnifón virtual

Reconstrucción web modular e interactiva del **Omnifón**, el primer sintetizador diseñado y construido en México por el ingeniero y compositor **Raúl Pavón Sarrelangue** (c. 1960–1964).

> [!NOTE]
> Es una **reconstrucción históricamente informada**, no una emulación electrónica de circuito: no existen esquemáticos, listas de materiales ni grabaciones certificadas del prototipo original.

## Gabinete modular y ruteo por cables

Cada módulo del gabinete es un procesador independiente (`AudioWorkletProcessor`) conectado mediante cables virtuales en tiempo real a frecuencia de audio:

| Fila | Módulos en el gabinete | Función |
|---|---|---|
| **Superior** | **Envolvedor** · **Aleator** · **Mod. Anillo** · **Ruidor** · **Reverberal** | VCA controlado, muestreo/retención aleatoria (escalón y suave), modulación en anillo, ruido blanco/rosa y reverberación |
| **Media** | **Integrador Envolv.** · **Oscilador 1** · **Oscilador 2** · **Filtro-V** · **Filtro-O** | Envolvente ADSR con pulso manual, 2 VCOs continuos (`5 Hz – 20 kHz`), filtro controlado por voltaje (bajos/banda/altos) y banco gráfico de 10 octavas (`25 Hz – 15 kHz` + salidas individuales y suma) |
| **Inferior** | **Pulsador** · **Secuenciador (3 × 10)** | Reloj maestro con marcha/paro y secuenciador analógico de 10 pasos y 3 filas de voltaje |
| **Consola** | **Teclado (5 octavas)** · **Salida + Osciloscopio** | Conversor teclado/MIDI a voltaje y pulso + etapa maestra estéreo con osciloscopio de fósforo verde |

### Parches incluidos

- **Prototipo:** Cadena sustractiva clásica (Teclado → Oscilador → Filtro-V → Envolvedor).
- **Secuencia:** Pulsador + Secuenciador de 10 pasos modulando tono y ancho de pulso, con Aleator y Reverberal.
- **Cósmico:** Textura electroacústica generativa con FM lenta, modulador en anillo y ruido rosa filtrado por el banco de octavas.
- **Vacío:** Sin cables, listo para parchar desde cero.

## Controles

- **Tender cables:** Arrastra desde cualquier conector (`Entrada` ↔ `Salida`).
- **Desconectar:** Arrastra desde una entrada ocupada y suelta fuera (o conéctala en otra entrada).
- **Perillas y deslizadores:** Arrastre vertical en perillas y horizontal en el banco Filtro-O (`Shift` = ajuste fino, doble clic = valor inicial, rueda del ratón).
- **Teclado:** Ratón/táctil (con glissando), teclado de computadora (`A`–`Ñ`, `Z`/`X` cambian de octava) o controlador **Web MIDI**.

## Desarrollo

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # genera dist/
```

### Estructura

```
src/
  engine/modules.ts      catálogo declarativo de los 13 tipos de módulos y el gabinete
  engine/processors.ts   procesadores DSP por muestra (AudioWorklet)
  rack.ts                grafo de AudioWorkletNodes y conexión dinámica de cables
  patches.ts             parches iniciales
  ui/                    paneles de aluminio, perillas, cables con caída catenaria, teclado y osciloscopio
```

## Fuentes

- Raúl Pavón Sarrelangue, *La electrónica en la música… y en el arte*, SEP / INBA-CENIDIM, 1981, cap. IV (pp. 170–204).
- Ricardo Dal Farra, tesis doctoral, UQAM, 2006 (fig. 23) — https://archipel.uqam.ca/2062/1/D1367.pdf
- Martín Matus Lerner, *Latin American NIMEs*, NIME 2019 — https://nime.org/proceedings/2019/nime2019_paper044.pdf
- *Sul Ponticello* — Dispositivos sonoros experimentales y luthería electrónica en América Latina
- Manuel Rocha Iturbide, *La música electroacústica en México* — https://www.artesonoro.net/electroacustica/electromex.html
