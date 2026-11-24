# Manual de Usuario y Guía de Parcheo · Omnifón Virtual

Bienvenido al **Omnifón Virtual**, reconstrucción interactiva en navegador del sintetizador modular mexicano diseñado por **Raúl Pavón Sarrelangue**.

---

## 1. Inicio rápido

1. **Encender el audio:** Haz clic en el botón **`Encender`** (arriba a la derecha). La lámpara roja se iluminará (`Activo`) y comenzará a sonar el parche cargado.
2. **Explorar los 8 parches:** En la barra **`Parches`**, recorre las 8 configuraciones musicales y experimentales encabezadas siempre por **`1 · Fig. IV.38`** (`1 · Fig. IV.38`, `2 · Teclado`, `3 · Bajo 8p`, `4 · Campanas`, `5 · Aleatorio`, `6 · Formantes`, `7 · Percusión` y `8 · Cosmos`). Debajo de la barra verás la explicación de cada parche activo.
3. **Ver debajo de los cables o limpiar el gabinete:** Haz clic en **`Atenuar cables`** para volver translúcidos los cables mientras operas controles, o en **`Sin cables`** para desconectar todo y parchar desde cero.
4. **Cambiar idioma:** Usa el conmutador **`ES` | `EN`** en la barra superior para alternar toda la interfaz entre Español e Inglés sin cortar el sonido.
5. **Consultar historia:** El botón **`ⓘ Información`** abre la reseña histórica ilustrada con la lámina original *Figura IV.38* (1981).

---

## 2. Gestos e interacción

| Elemento | Acción | Detalle |
|---|---|---|
| **Tender un cable** | Arrastrar desde cualquier conector | Puedes arrastrar de `Salida → Entrada` o de `Entrada → Salida`. Una salida puede alimentar múltiples entradas simultáneamente. |
| **Desconectar / mover cable** | Arrastrar desde una **entrada ocupada** | Desenchufa ese extremo: suéltalo fuera para quitarlo o llévalo a otra entrada. |
| **Perillas rotatorias** | Arrastrar verticalmente o rueda del ratón | Mantén **`Shift`** para ajuste fino de alta precisión. **Doble clic** restablece su valor inicial. También responden a las flechas del teclado al enfocarlas. |
| **Deslizadores (`Filtro-O`)** | Arrastrar horizontalmente | `Shift` = ajuste fino; doble clic = valor inicial. |
| **Teclado musical (5 octavas)** | Ratón, pantalla táctil, QWERTY o MIDI | Soporta glissando arrastrando el puntero sobre las teclas. |

### Atajos del teclado de computadora
- **Teclas blancas:** `A` `S` `D` `F` `G` `H` `J` `K` `L` `Ñ` (o `;` en teclado inglés)
- **Teclas negras:** `W` `E` · `T` `Y` `U` · `O` `P`
- **Bajar / subir octava:** `Z` / `X` (la octava activa se muestra en el módulo `Teclado`, p. ej. `C3`)
- **Controladores MIDI USB:** Se detectan automáticamente al encender el instrumento en navegadores compatibles con **Web MIDI** (Chrome, Edge, Opera, Brave).

> **Importante:** Para tocar melodías desde el teclado o MIDI inmediatamente, selecciona el parche **`2 · Teclado`** (o **`6 · Formantes`**).

---

## 3. Convención de señales en el gabinete

Al igual que en un sintetizador modular analógico de estudio, **todas las señales viajan a frecuencia de audio** y cualquier salida puede conectarse a cualquier entrada:

- **Audio:** Rango nominal `−1.0` a `+1.0`.
- **Voltaje de control (CV):** Escala exponencial donde **`+1.0` equivale a `+1 octava`** (análogo al estándar `1 V/oct`).
- **Pulsos y compuertas (Gate/Trigger):** `0.0` (inactivo) a `1.0` (activo), con umbral de disparo en `0.5`.

---

## 4. Referencia módulo por módulo

### Fila superior

1. **`ENVOLVEDOR` (Amplificador controlado por voltaje / VCA)**
   - **Entradas y perillas acopladas (`mín.–máx.`):** `Entrada 1` (nivel base directo de la señal de entrada) y `Entrada 2` (profundidad de ganancia gobernada por la señal de control, típicamente desde `Integrador Envolv.`).
   - **Salidas:** Par de salidas idénticas en paralelo unidas por barra vertical.

2. **`ALEATOR` (Generador aleatorio calibrado)**
   - **Sin perillas, fiel al módulo original:** Al recibir pulsos en `Entrada`, genera un nuevo voltaje aleatorio en cada flanco ascendente (si `Entrada` está libre, oscila autónomamente a ~2.5 Hz).
   - **Salidas:** Superior (`Escalón`, cambios discretos) e inferior (`Suave`, deriva continua filtrada).

3. **`MOD. ANULAR` (Modulador en anillo)**
   - **Entradas:** `Entrada 1` (señal A), `Entrada 2` (portadora externa; si está libre, usa una portadora senoidal interna de `220 Hz`) y `Entrada 3` (modulación de frecuencia/amplitud de la portadora).
   - **Perilla central (`mín.–máx.`):** Nivel de salida del producto anular.
   - **Salidas:** Dos salidas idénticas en paralelo.

4. **`RUIDOR` (Generador de ruido de referencia)**
   - **Sin perillas, fiel al original:** Entrega niveles calibrados de estudio en sus salidas **`blanco`** (espectro plano) y **`rosa`** (`−3 dB/oct`, energía constante por octava).

5. **`REVERBERAL` (Unidad de reverberación con mezclador doble)**
   - **Entradas:** `Entrada 1` y `Entrada 2` (se suman internamente).
   - **Perillas:** `intensidad` (`0–máx.`, proporción de reverberación) y `tiempo` (`0–máx.`, decaimiento espacial).
   - **Salidas:** Dos salidas en paralelo a la derecha.

### Fila media

6. **`INTEGRADOR ENVOLV.` (Envolvente trapezoidal de 3 etapas)**
   - **Controles verticales:** `ataque` (`5ms.–5seg.`), **`duración`** (`5ms.–5seg.`, tiempo de retención en nivel máximo) y `decaimiento` (`5ms.–5seg.`).
   - **Disparo:** Entrada `pulso` acoplada al conmutador deslizante **`ext.` / `int.`** (`ext.` = disparo por cable o con el **pulsador metálico manual** contiguo; `int.` = autociclado continuo tipo LFO trapezoidal).
   - **Salidas:** Par en paralelo `env.` (`0 → +1`) y salida de puerta `pulso` (activa durante ataque + duración).

7. **`OSCILADOR` (×2 unidades idénticas)**
   - **Frecuencia:** Conector `frecuencia` (`1 oct/unidad`), perilla blanca grande `frecuencia` (`5hz. – 20khz.`) y perilla `aj. fino` (`±2 semitonos`) enlazada verticalmente.
   - **Salidas de onda (`Salidas`):** `∿` (senoidal), `∧` (triangular), `⩘` (rampa / diente de sierra) y `⊓` (pulso rectangular), con perilla inferior derecha `ancho` (`⊔–⊓`, ciclo útil `5–95 %`).
   - **Modulación:** Conector inferior `modular en frec.` enlazado a su perilla blanca (`0–máx.`) y conmutador de acoplamiento **`dir.` / `rec.`** (bipolar directo vs. rectificado positivo).

8. **`FILTRO-V` (Filtro multimodo controlado por voltaje)**
   - **Sección superior:** Conector de audio `Entrada`, entrada CV + perilla oscura `ancho` (`mín.–máx.`, resonancia / ancho de banda) y deslizador horizontal **`Corte`** (`±2 octavas`).
   - **Sección inferior:** Entrada CV + perilla blanca **`Centro`** (`5Hz – 15kHz`) y entrada CV + deslizador horizontal **`modulación`** (`0 – 5 octavas`).
   - **Salidas simultáneas:** `baj.` (pasa-bajos), `alt.` (pasa-altos) y `banda` (pasa-banda).

9. **`FILTRO-O` (Banco de filtros de 10 octavas)**
   - **Izquierda:** Conector `Entrada` y deslizador vertical **`Corte`** (amortiguamiento progresivo de las bandas agudas).
   - **Centro y derecha:** 10 deslizadores horizontales para **`25`, `50`, `100`, `200`, `400`, `800`, `1.6k`, `3.2k`, `6.5k` y `13k` Hz** con sus 10 salidas individuales, más deslizador y salida maestra **`Suma`**.

### Fila inferior y consola

10. **`PULSADOR` (Reloj maestro de pulsos)**
    - **Arranque y paro:** Conectores `inicio` y `fin`, cada uno acoplado a su **pulsador metálico redondo** para iniciar o detener el reloj manualmente.
    - **Controles:** Entrada CV + perilla oscura `Pulsos` (`0–100`, ancho del pulso) y entrada CV + perilla blanca `reloj` (`mín.–máx.`, `0.1 – 40 Hz`).
    - **Salidas:** Bus vertical de 3 salidas (`Pulsos 1` y `2` en fase, `Pulsos 3` en antifase).

11. **`S E C U E N C I A D O R` (Matriz analógica de 3 × 10 pasos)**
    - **Columna izquierda:** Entrada `pulsos` (reloj), salida de compuerta `Salida`, entrada `reinicio`, **3 salidas de fila** alineadas a la izquierda de cada hilera de perillas (la Fila 1 cuantizada en semitonos; Filas 2 y 3 continuas) y salida inferior `voltaje` (Fila 1 sin cuantizar).
    - **10 columnas (`1–10`):** Cada columna posee arriba su **LED rojo** y su **conector individual de pulso de paso**; puentear con un cable corto el paso `N` hacia `reinicio` hace que la secuencia cicle exactamente de `1` a `N` (por ejemplo, en el preset **`Fig. IV.38`**, el conector del paso 6 va puenteado a `reinicio` para ciclar 5 pasos, igual que en la foto del libro).
    - **10 conmutadores inferiores:** Activan o silencian el pulso de salida en cada paso individual.

12. **`TECLADO` y `SALIDA`**
    - **`Teclado`:** Convierte notas (ratón, QWERTY o MIDI) en `Voltaje` (con `Portamento` ajustable) y `Pulso` (con redisparo automático en notas ligadas).
    - **`Salida`:** Recibe `Izquierda` y `Derecha` (si solo conectas una entrada, se escucha en ambos canales; si conectas ambas, aplica una imagen estéreo natural), regula `Volumen` con limitación suave e integra el **Osciloscopio** en tiempo real (`Rápida`, `Media`, `Lenta`).

---

## 5. Guía de los 8 parches incluidos y recetas propias

### Banco oficial de 8 parches
1. **`1 · Fig. IV.38` *(Siempre al inicio)*:** El ejemplo de alambrado original del libro de Raúl Pavón (1981): puente de 5 pasos en el secuenciador, voz melódica con modulación anular filtrada por el `Filtro-O` y segunda voz de ruido rosa con filtrado programado en el `Filtro-V`.
2. **`2 · Teclado`:** Voz solista sustractiva clásica (1960–64) con vibrato de `5.4 Hz` desde `Oscilador 2`, barrido resonante de filtro y reverberación estéreo, lista para tocarse en el teclado o MIDI.
3. **`3 · Bajo 8p`:** Línea de bajo analógico hipnótico en 8 pasos (puente al paso 9) con onda rectangular estrecha y resonancia modulada paso a paso desde la Fila 2.
4. **`4 · Campanas`:** Metalofonía electroacústica en compás asimétrico de 7 pasos combinando ambos osciladores en el `Mod. Anular` y realzando parciales agudos en el `Filtro-O`.
5. **`5 · Aleatorio`:** Estudio generativo autónomo: el `Integrador Envolv.` en modo interno (`int.`) se autodispara en bucle y gobierna al `Aleator` para producir secuencias y modulaciones FM siempre cambiantes.
6. **`6 · Formantes`:** Coro espectral donde una rampa rica en armónicos y un soplo de ruido rosa atraviesan formantes vocales dibujados en el `Filtro-O` (también puedes cambiar la nota fundamental desde el teclado).
7. **`7 · Percusión`:** Caja de ritmos analógica de 10 pasos con bombos de caída exponencial y ráfagas metálicas de ruido blanco articuladas mediante los 10 conmutadores inferiores del secuenciador.
8. **`8 · Cosmos`:** Paisaje contemplativo de respiración lenta autociclada (`int.`), modulación anular subaudible y viento cósmico.

### Tres recetas para crear tus propios parches

Haz clic primero en el botón superior **`Sin cables`**:

1. **Bajo ácido / percusivo con teclado:**
   - `Teclado (Voltaje)` → `Oscilador 1 (Frecuencia)`
   - `Oscilador 1 (Cuadrada)` → `Filtro-V (Entrada)`
   - `Filtro-V (Bajos)` → `Envolvedor (Entrada)` → `Salida (Izquierda)`
   - `Teclado (Pulso)` → `Integrador (Pulso)`, e `Integrador (Salida)` tanto a `Envolvedor (Control)` como a `Filtro-V (Modulación)`. Baja `Ancho` en `Filtro-V` al `20 %` para resaltar la resonancia.
2. **Campanas metálicas electroacústicas (Modulación Anular):**
   - `Oscilador 1 (Senoidal)` → `Mod. Anular (Entrada A)`
   - `Oscilador 2 (Senoidal)` → `Mod. Anular (Entrada B)` (ajusta `Oscilador 2` a una relación inarmónica, p. ej. `615 Hz`)
   - `Mod. Anular (Salida)` → `Envolvedor (Entrada)` → `Reverberal (Entrada 1)` → `Salida (Izquierda)`
   - Usa el botón `PULSO` del `Integrador` conectado a `Envolvedor (Control)` con `Ataque` mínimo y `Decaimiento` de `1.8 s`.
3. **Viento espectral generativo:**
   - `Ruidor (Rosa)` → `Filtro-O (Entrada)` → `Filtro-O (Suma)` → `Filtro-V (Entrada)`
   - `Aleator (Suave)` → `Filtro-V (Control)`
   - `Filtro-V (Banda)` → `Reverberal (Entrada 1)` → `Salida (Izquierda)`
   - Dibuja formantes vocales moviendo bandas alternas del `Filtro-O`.
