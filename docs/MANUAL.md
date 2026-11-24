# Manual de Usuario y Guía de Parcheo · Omnifón Virtual

Bienvenido al **Omnifón Virtual**, reconstrucción interactiva en navegador del sintetizador modular mexicano diseñado por **Raúl Pavón Sarrelangue**.

---

## 1. Inicio rápido

1. **Encender el audio:** Haz clic en el botón **`Encender`** (arriba a la derecha). La lámpara roja se iluminará (`Activo`) y comenzará a sonar el preset cargado.
2. **Explorar presets:** En la barra superior **`Presets`**, alterna entre **`Fig. IV.38`**, **`Teclado`**, **`Secuencia`**, **`Cósmico`** y **`Vacío`**.
3. **Ver debajo de los cables:** Haz clic en **`Atenuar cables`** para volver translúcidos los cables mientras ajustas perillas o lees las etiquetas del panel.
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

> **Importante:** Para que el teclado produzca sonido, sus salidas (`Voltaje` y `Pulso`) deben estar conectadas (por ejemplo, seleccionando el preset **`Teclado`**).

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
   - **Entradas:** `Entrada` (señal de audio o CV a escalar), `Control` (señal moduladora, típicamente desde `Integrador Envolv.`).
   - **Salidas:** Dos salidas idénticas en paralelo (`Salida`) para enviar la señal a dos destinos sin necesitar múltiplos externos.
   - **Perillas:** `Mínimo` (nivel base / drone cuando `Control = 0`) y `Máximo` (profundidad de ganancia aplicada por `Control`).

2. **`ALEATOR` (Generador aleatorio / Sample & Hold)**
   - **Entrada:** `Entrada` (reloj externo de disparo; si no tiene cable conectado, usa su reloj interno gobernado por `Velocidad`).
   - **Salidas:** `Escalón` (voltajes aleatorios discretos por paso) y `Suave` (variación aleatoria filtrada continuamente).
   - **Perillas:** `Velocidad` (`0.05 – 50 Hz`) y `Nivel` (`0 – 100 %`).

3. **`MOD. ANULAR` (Modulador en anillo de cuatro cuadrantes)**
   - **Entradas:** `Entrada A` (señal principal) y `Entrada B` (portadora externa; si no se conecta nada en `B`, utiliza su oscilador senoidal interno ajustado con `Portadora`).
   - **Salida:** `Salida` (`A × B`, generando bandas laterales suma y diferencia de timbre metálico/acampanado).
   - **Perillas:** `Portadora` (`1 Hz – 5 kHz`) y `Nivel`.

4. **`RUIDOR` (Generador de ruido)**
   - **Salidas:** `Blanco` (energía constante por hercio, brillante) y `Rosa` (`−3 dB/oct`, energía constante por octava, ideal para percusión, viento y filtrado formántico).
   - **Perilla:** `Nivel`.

5. **`REVERBERAL` (Unidad de reverberación con mezclador doble)**
   - **Entradas:** `Entrada 1` y `Entrada 2` (se suman internamente antes del tanque reverberante).
   - **Salida:** `Salida`.
   - **Perillas:** `Intensidad` (balance seco/húmedo) y `Tiempo` (decaimiento espacial).

### Fila media

6. **`INTEGRADOR ENVOLV.` (Generador de envolvente ADSR)**
   - **Entrada:** `Pulso` (compuerta desde `Teclado` o `Pulsador`).
   - **Salidas:** `Salida` (`0 → +1`) e `Inversa` (`0 → −1`).
   - **Perillas:** `Ataque`, `Decaimiento`, `Sostén` y `Extinción` (`1 ms – 10 s`).
   - **Botón `PULSO`:** Disparo manual momentáneo mientras lo mantengas presionado.

7. **`OSCILADOR` (×2 unidades idénticas)**
   - **Entradas:** `Frecuencia` (seguimiento `1 octava/unidad`), `Modulador` (FM exponencial atenuada por la perilla `Modulador`) y `Ancho` (modulación de ancho de pulso / PWM).
   - **Salidas simultáneas:** `Senoidal`, `Triangular`, `Rampa` (diente de sierra) y `Cuadrada` (pulso variable).
   - **Perillas:** `Frecuencia` blanca (`5 Hz – 20 kHz` en barrido continuo, desde LFO lento hasta ultrasonido), `Aj. fino` (`±2 semitonos`), `Ancho` (`5 – 95 %`) y `Modulador`.

8. **`FILTRO-V` (Filtro multimodo controlado por voltaje)**
   - **Entradas:** `Entrada` (audio), `Control` (`1 oct/unidad` directo) y `Modulación` (escalada bipolarmente por la perilla `Modulación`).
   - **Salidas simultáneas:** `Bajos` (low-pass), `Banda` (band-pass) y `Altos` (high-pass).
   - **Perillas:** `Centro` blanca (`20 Hz – 16 kHz`), `Ancho` (ancho de banda: valores bajos producen alta resonancia y autoénfasis) y `Modulación` (`−5 a +5 oct`).

9. **`FILTRO-O` (Banco de filtros de 10 octavas)**
   - **Entrada:** `Entrada`.
   - **Deslizadores y salidas:** 10 filtros pasa-banda centrados en **`25`, `50`, `100`, `200`, `400`, `800`, `1.6k`, `3.2k`, `6.5k` y `15k` Hz** (cada banda cuenta con su propia salida individual a la derecha para ruteos espectrales avanzados) más deslizador y salida maestra **`Suma`**.

### Fila inferior y consola

10. **`PULSADOR` (Reloj maestro de pulsos)**
    - **Entradas:** `Inicio` y `Fin` (disparo/paro por pulso externo).
    - **Salidas:** `Pulsos 1`, `Pulsos 2` (en fase) e `Inverso` (antifase).
    - **Perillas y botón:** `Reloj` (`0.1 – 40 Hz`), `Ancho` de pulso y botón con indicador luminoso **`MARCHA`**.

11. **`S E C U E N C I A D O R` (Matriz analógica de 3 × 10 pasos)**
    - **Entradas:** `Pulso` (avanza un paso en cada flanco ascendente) y `Reinicio` (vuelve al paso 1).
    - **Salidas:** `Fila A` (con selector `Libre` / cuantizada a `Semitono` en rango de 2 octavas), `Fila B`, `Fila C` y `Pulso` (reenvío de reloj).
    - **Controles:** 30 perillas de paso (`1–10` con LEDs indicadores) y perilla `Pasos` (`1` a `10` pasos activos).

12. **`TECLADO` y `SALIDA`**
    - **`Teclado`:** Convierte notas (ratón, QWERTY o MIDI) en `Voltaje` (con `Portamento` ajustable) y `Pulso` (con redisparo automático en notas ligadas).
    - **`Salida`:** Recibe `Izquierda` y `Derecha` (si solo conectas una entrada, se escucha en ambos canales; si conectas ambas, aplica una imagen estéreo natural), regula `Volumen` con limitación suave e integra el **Osciloscopio** en tiempo real (`Rápida`, `Media`, `Lenta`).

---

## 5. Tres recetas para crear tus propios parches

Parte siempre del preset **`Vacío`**:

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
