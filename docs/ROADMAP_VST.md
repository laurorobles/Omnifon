# Plan de Trabajo y Arquitectura: Omnifón VST / AU / CLAP

Este documento establece la hoja de ruta técnica, la arquitectura de software y el plan de ejecución por fases para portar el sintetizador modular mexicano **Omnifón** desde su implementación web (TypeScript / Web Audio API) a formatos de plugin nativo multiplataforma de 64 bits (**VST3, Audio Unit, CLAP y ejecutable Standalone**) para estaciones de trabajo de audio digital (DAWs como Ableton Live, Logic Pro, Pro Tools, FL Studio, Reaper, Bitwig y Cubase en macOS y Windows).

---

## 1. Justificación y ventaja de partida

A diferencia de muchos sintetizadores web implementados con nodos prefabricados de Web Audio (`OscillatorNode`, `BiquadFilterNode`), el **Omnifón Virtual ya fue diseñado y programado desde el primer día con DSP muestra a muestra dentro de 14 AudioWorkletProcessors independientes**:

1. **Código DSP en aritmética pura:** Las fórmulas en `src/engine/processors.ts` (modulación exponencial FM a 1 V/oct, generador aleatorio por pasos y suave, filtro de estado variable Chamberlin/SVF, banco de 10 octavas con filtros bicuadráticos directos, modulador anular de 4 cuadrantes, envolvente trapezoidal de 3 etapas y líneas de retardo de reverberación Schroeder/Moorer) están escritas en aritmética de punto flotante de 32/64 bits sin dependencias de DOM ni de navegador.
2. **Topología desacoplada:** La estructura de módulos, conectores y cables de `src/engine/modules.ts` mapea directamente a un grafo de procesamiento de audio en bloques con orden topológico o matriz de cables.
3. **Serialización de parches:** La especificación de conexiones `from: { module, jack }, to: { module, jack }` y valores normalizados `[0..1]` ya está estandarizada y probada con los 8 presets de fábrica.

---

## 2. Elección de Framework y Tecnologías

### Framework Principal: **JUCE 8 (C++20)**

| Criterio | JUCE 8 (C++20) | Alternativa Rust (nih-plug) |
|---|---|---|
| **Compatibilidad DAW** | 100% probada en todos los hosts (VST3, AU v2/v3, Standalone, AAX opcional). | Excelente en CLAP y VST3, soporte AU experimental. |
| **Arquitectura de Parches / Cables** | Soporte maduro para grafos dinámicos (`juce::AudioProcessorGraph` o buffer circular interno). | Requiere infraestructura a medida para ruteo de cables. |
| **Renderizado Gráfico (UI)** | Soporte nativo de aceleración OpenGL / Metal / Direct2D y LookAndFeel vectorial ultra-preciso. | Egui / VIZIA (bueno pero con menor control tipográfico y de acabado físico). |
| **Gestión de Parámetros** | `juce::AudioProcessorValueTreeState` (APVTS) con automatización DAW completa, Undo/Redo y serialización XML/JSON. | Param traits propios. |

**Decisión:** **JUCE 8 en C++20** es el estándar de la industria y la opción recomendada para asegurar máxima estabilidad, compatibilidad en macOS (Apple Silicon y x86_64) y Windows (10/11 x64), y una experiencia idéntica en cualquier DAW.

---

## 3. Arquitectura del Plugin Nativo

```
┌────────────────────────────────────────────────────────────────────────┐
│                        OmnifonAudioProcessor                           │
│  (Hereda de juce::AudioProcessor / juce::AudioProcessorValueTreeState)  │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    RackDSP (Audio Thread)                        │  │
│  │  - Matriz de cables y ruteo interno (PatchCableMatrix)           │  │
│  │  - 14 Módulos DSP C++ (Sample-rate nativo 44.1 - 192 kHz):       │  │
│  │    • EnvolvedorDSP        • AleatorDSP          • RingModDSP     │  │
│  │    • RuidorDSP            • ReverberalDSP       • IntegradorDSP  │  │
│  │    • OsciladorDSP (x2)    • FiltroVDSP          • FiltroODSP     │  │
│  │    • PulsadorDSP          • SecuenciadorDSP     • TecladoDSP     │  │
│  │    • SalidaDSP (con anillo FIFO para osciloscopio en UI)         │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                   OmnifonAudioProcessorEditor                    │  │
│  │  - Gabinete modular en madera de nogal y placas de aluminio      │  │
│  │  - Componentes LookAndFeel personalizados:                        │  │
│  │    • VintageKnob (acabado estriado negro y crema, Shift=fino)    │  │
│  │    • SliderHorizontal / Vertical (Filtro-O)                      │  │
│  │    • MetalToggleSwitch y PushButton (pulsadores de reloj)        │  │
│  │    • CableLayerComponent (Curvas de Bézier cúbicas con física)   │  │
│  │    • OscilloscopeComponent (Dibujado vectorial a 60 fps)         │  │
│  │    • Teclado de 5 octavas con soporte multitáctil y MPE          │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Plan de Trabajo en 5 Fases

```
Fase 1: Motor DSP C++ Core       ───► Fase 2: Grafo y Parches (APVTS)
                                               │
                                               ▼
Fase 4: Verificación y QA Host   ◄─── Fase 3: Interfaz Gráfica (GUI)
        │
        ▼
Fase 5: Empaquetado y Distribución Multiplataforma
```

### Fase 1: Motor DSP en C++ Moderno (Semanas 1–3)
- [ ] Configurar repositorio y CMake con JUCE 8 modular.
- [ ] Portar las clases DSP desde `src/engine/processors.ts`:
  - `OscillatorDSP`: Generación de 4 formas de onda mediante fase acumulada y técnicas PolyBLEP para suprimir aliasing a frecuencias extremas (`5 Hz – 20 kHz`).
  - `FilterVDSP`: Implementación SVF (State-Variable Filter) con salidas simultáneas Lowpass, Highpass y Bandpass moduladas por voltaje.
  - `FilterODSP`: Banco de 10 filtros con coeficientes biquad independientes y control maestro.
  - `IntegradorDSP`: Envolvente trapezoidal de 3 estados (Ataque, Duración/Hold, Decaimiento) con modos `ext.` y `int.`.
  - `RingModDSP`: Multiplicador analógico con oscilador senoidal interno o portadora externa.
  - `AleatorDSP`: Generador de ruido pseudo-aleatorio con retención de muestra y filtrado de segundo orden para salida suave.
  - `ReverberalDSP`: Red de filtros todos-paso y líneas de retardo en peine para la resonancia física del gabinete.
  - `SecuenciadorDSP`: Reloj interno/externo con lógica de matriz 3×10 y cuantización cromática en Fila 1.
- [ ] Pruebas unitarias de audio en C++ (Catch2 o GoogleTest) para verificar que las salidas coincidan numéricamente con la versión Web Audio.

### Fase 2: Grafo de Conexiones y Árbol de Parámetros (Semanas 4–5)
- [ ] Implementar la clase `PatchCableMatrix`:
  - Conexión dinámica punto a punto entre salidas y entradas de módulos.
  - Buffer de evaluación con resolución de realimentación (feedback loop) de 1 muestra para modulaciones complejas.
- [ ] Declarar el árbol `juce::AudioProcessorValueTreeState` (APVTS):
  - Todos los parámetros de cada módulo expuestos al DAW para automatización total de pistas (frecuencia, resonancia, corte de octavas, pasos de secuenciador).
- [ ] Sistema de presets XML/JSON:
  - Guardar y cargar tanto los valores de los controles como los cables conectados.
  - Precargar los **8 parches oficiales** encabezados por la **Fig. IV.38**.

### Fase 3: Interfaz Gráfica de Usuario (GUI) de Alta Definición (Semanas 6–8)
- [ ] Creación de `OmnifonLookAndFeel`:
  - Recreación vectorial de las perillas estriadas (`VintageKnob`) en negro mate y blanco crema para frecuencias.
  - Deslizadores retro para el `Filtro-O` y pulsadores metálicos redondos para el `Pulsador`.
  - Serigrafía tipográfica idéntica al gabinete original en aluminio anodizado claro con marco de nogal.
- [ ] Capa interactiva de cables (`CableLayerComponent`):
  - Conexión por arrastre idéntica a la versión web.
  - Renderizado mediante curvas de Bézier cúbicas con efecto de catenaria física (peso y balanceo suave).
  - Opción de atenuación de cables para facilitar la vista de perillas.
- [ ] Integración del osciloscopio en tiempo real mediante buffer circular lock-free (`juce::AbstractFifo`).
- [ ] Teclado de 5 octavas con soporte MIDI y automatización.

### Fase 4: Pruebas de Compatibilidad y Optimización en DAWs (Semanas 9–10)
- [ ] Validación de formatos:
  - **VST3** en Ableton Live 11/12, Cubase 13, Reaper 7, FL Studio 21/24 (macOS y Windows).
  - **Audio Unit (AUv2)** en Logic Pro X y GarageBand (macOS).
  - **CLAP** en Bitwig Studio 5 y Reaper 7.
  - **Standalone** con entrada/salida de audio directa (CoreAudio / ASIO / WASAPI).
- [ ] Optimización de rendimiento:
  - Uso de instrucciones SIMD (SSE/AVX/NEON) en el procesamiento del banco de filtros de 10 octavas.
  - Cero asignaciones de memoria dinámica (`malloc`/`new`) en el hilo de audio (`processBlock`).
  - Consumo de CPU inferior al 1.5% de un hilo de CPU moderno a 48 kHz / 128 samples de buffer.

### Fase 5: Instaladores, Firma Digital y Lanzamiento (Semanas 11–12)
- [ ] Automatización de compilación con GitHub Actions (CI/CD):
  - Build matriz en `macos-latest` (Binario Universal arm64 + x86_64) y `windows-latest` (x64).
- [ ] Empaquetado:
  - Instalador macOS `.pkg` con notarización de Apple (`notarytool`).
  - Instalador Windows `.exe` / `.msi` con Inno Setup.
- [ ] Documentación, presets de fábrica adicionales y publicación de release en GitHub bajo el crédito `@laurorobles`.

---

## 5. Mapeo Directo: Web Audio Worklet ➔ C++ JUCE

| Módulo Web (`src/engine/`) | Implementación en C++ / JUCE |
|---|---|
| `processors.ts` (`OscillatorProcessor`) | `class OscillatorDSP : public juce::dsp::ProcessorBase` (PolyBLEP anti-aliased) |
| `processors.ts` (`FilterVProcessor`) | `class FilterVDSP` (State Variable Filter z^-1) |
| `processors.ts` (`FilterOProcessor`) | `class FilterODSP` (Array de 10 Biquad Peak Filters) |
| `processors.ts` (`RingModProcessor`) | Multiplicación de buffers de entrada a nivel de bloque |
| `processors.ts` (`AleatorProcessor`) | Generador congruencial lineal + filtro RC paso-bajos |
| `rack.ts` (`Rack.connect / disconnect`) | `PatchMatrix::connect(OutputPin, InputPin)` |
| `ui/cables.ts` (`CableLayer`) | `class CableCanvas : public juce::Component` (`juce::Path` con curvas cúbicas) |
| `ui/controls.ts` (`knob`) | `class MatteKnob : public juce::Slider` (`LookAndFeel_V4`) |

---

## 6. Recursos Necesarios

1. **Herramientas de software:**
   - CMake 3.25+
   - JUCE 8.0.x (Licencia abierta GPLv3 / Comercial)
   - Compilador: Xcode / Clang en macOS; MSVC (Visual Studio 2022) en Windows.
   - Herramientas de audio test: `pluginval` (validador oficial de estándares VST3/AU/CLAP).
2. **Repositorio:**
   - Se creará un submódulo o directorio `vst/` dentro del repositorio principal `https://github.com/laurorobles/Omnifon` manteniendo la integridad del proyecto web y facilitando la sincronización de presets.
