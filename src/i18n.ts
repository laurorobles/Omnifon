export type Lang = 'es' | 'en';

/** Diccionario ES → EN para etiquetas de módulos, conectores y controles. */
const EN_LABELS: Record<string, string> = {
  // Títulos de módulos
  'Envolvedor': 'Enveloper',
  'Aleator': 'Randomizer',
  'Mod. Anular': 'Ring Mod.',
  'Ruidor': 'Noise Gen.',
  'Reverberal': 'Reverberator',
  'Integrador Envolv.': 'Env. Integrator',
  'Oscilador': 'Oscillator',
  'Filtro-V': 'V-Filter',
  'Filtro-O': 'O-Filter',
  'Pulsador': 'Pulser',
  'Secuenciador': 'Sequencer',
  'S E C U E N C I A D O R': 'S E Q U E N C E R',
  'Teclado': 'Keyboard',
  'Salida': 'Output',

  // Secciones E/S
  'Entradas': 'Inputs',
  'Salidas': 'Outputs',
  'entrada': 'input',
  'salida': 'output',

  // Conectores y parámetros
  'Entrada': 'Input',
  'Entrada 1': 'Input 1',
  'Entrada 2': 'Input 2',
  'Entrada 3': 'Input 3',
  'Entrada A': 'Input A',
  'Entrada B': 'Input B',
  'Salida 1': 'Output 1',
  'Salida 2': 'Output 2',
  'Control': 'Control',
  'Mínimo': 'Min',
  'Máximo': 'Max',
  'Escalón': 'Stepped',
  'Suave': 'Smooth',
  'Velocidad': 'Rate',
  'Nivel': 'Level',
  'Portadora': 'Carrier',
  'Blanco': 'White',
  'blanco': 'white',
  'Rosa': 'Pink',
  'rosa': 'pink',
  'Intensidad': 'Intensity',
  'intensidad': 'intensity',
  'Intensid.': 'Intensity',
  'Tiempo': 'Decay',
  'tiempo': 'time',
  'Pulso': 'Pulse',
  'pulso': 'pulse',
  'pulsos': 'pulses',
  'Pulsos': 'Pulses',
  'Pulsos 1': 'Pulses 1',
  'Pulsos 2': 'Pulses 2',
  'Pulsos 3': 'Pulses 3',
  'env.': 'env.',
  'env. 1': 'env. 1',
  'env. 2': 'env. 2',
  'ataque': 'attack',
  'duración': 'hold',
  'decaimiento': 'decay',
  'ext.': 'ext.',
  'int.': 'int.',
  'Disparo': 'Trigger',
  'frecuencia': 'frequency',
  'Frecuencia': 'Frequency',
  'aj. fino': 'fine tune',
  'ancho': 'width',
  'Ancho': 'Width',
  'modular en frec.': 'freq. mod.',
  'dir.': 'dir.',
  'd.': 'dir.',
  'rec.': 'rect.',
  'Corte': 'Cutoff',
  'Centro': 'Center',
  'modulación': 'modulation',
  'baj.': 'low',
  'alt.': 'high',
  'banda': 'band',
  'Suma': 'Sum',
  'inicio': 'start',
  'fin': 'stop',
  'reloj': 'clock',
  'reinicio': 'reset',
  'Fila 1': 'Row 1',
  'Fila 2': 'Row 2',
  'Fila 3': 'Row 3',
  'voltaje': 'voltage',
  'Voltaje': 'Voltage',
  'Portamento': 'Glide',
  'Izquierda': 'Left',
  'Derecha': 'Right',
  'Volumen': 'Volume',

  // Marcas de escala
  'mín.': 'min.',
  'máx.': 'max.',
  '5ms.': '5ms.',
  '5seg.': '5sec.',

  // Osciloscopio
  'Rápida': 'Fast',
  'Media': 'Med',
  'Lenta': 'Slow',
};

export function tr(text: string, lang: Lang): string {
  if (lang === 'es') return text;
  return EN_LABELS[text] ?? text;
}

export interface UiStrings {
  subtitle: string;
  byLabel: string;
  presets: string;
  dimCables: string;
  clearCables: string;
  unpatchedDesc: string;
  info: string;
  manual: string;
  powerOn: string;
  powerOff: string;
  keysHintHtml: string;
  footerHtml: string;
  close: string;
  loadFigPreset: string;
  audioError: string;
}

export const UI_STRINGS: Record<Lang, UiStrings> = {
  es: {
    subtitle: 'Raúl Pavón Sarrelangue · México · c. 1960',
    byLabel: 'Recreación virtual por',
    presets: 'Parches',
    dimCables: 'Atenuar cables',
    clearCables: 'Sin cables',
    unpatchedDesc: 'Gabinete desconectado: arrastra desde cualquier conector para crear tu propio parche.',
    info: 'Información',
    manual: 'Manual Ilustrado',
    powerOn: 'Encender',
    powerOff: 'Activo',
    keysHintHtml:
      'Teclas <kbd>A</kbd>–<kbd>Ñ</kbd><br><kbd>Z</kbd>/<kbd>X</kbd> octava: <b id="octave-label">C3</b>',
    footerHtml:
      'Arrastra desde un conector para tender un cable · arrastra desde una entrada ocupada para desconectar · ' +
      'perillas: arrastre vertical (Shift = fino, doble clic = inicial).<br />' +
      'Reconstrucción históricamente informada del Omnifón (c. 1960–64 / 1981). No es una emulación de circuito: no existen esquemáticos publicados.<br />' +
      '<a href="https://extasisrecords.bandcamp.com" target="_blank" rel="noopener noreferrer" class="footer-link">@extasisrecords</a>',
    close: 'Cerrar',
    loadFigPreset: 'Cargar preset Fig. IV.38',
    audioError: 'No se pudo iniciar el audio: ',
  },
  en: {
    subtitle: 'Raúl Pavón Sarrelangue · Mexico · c. 1960',
    byLabel: 'Virtual recreation by',
    presets: 'Patches',
    dimCables: 'Dim cables',
    clearCables: 'Unpatch all',
    unpatchedDesc: 'Unpatched cabinet: drag from any jack to build your own patch.',
    info: 'History & Info',
    manual: 'Illustrated Manual',
    powerOn: 'Power On',
    powerOff: 'Running',
    keysHintHtml:
      'Keys <kbd>A</kbd>–<kbd>;</kbd><br><kbd>Z</kbd>/<kbd>X</kbd> octave: <b id="octave-label">C3</b>',
    footerHtml:
      'Drag from any jack to patch a cable · drag from an occupied input to unplug · ' +
      'knobs: vertical drag (Shift = fine, double-click = reset).<br />' +
      'Historically informed reconstruction of the Omnifón (c. 1960–64 / 1981). Not a circuit-level clone: no schematics have been published.<br />' +
      '<a href="https://extasisrecords.bandcamp.com" target="_blank" rel="noopener noreferrer" class="footer-link">@extasisrecords</a>',
    close: 'Close',
    loadFigPreset: 'Load Fig. IV.38 preset',
    audioError: 'Could not start audio: ',
  },
};

export function renderInfoModal(lang: Lang, imgSrc: string): string {
  if (lang === 'en') {
    return `
      <div class="modal-header">
        <div>
          <p class="modal-kicker">History & Technical Context</p>
          <h2>The Omnifón of Raúl Pavón Sarrelangue</h2>
        </div>
        <button type="button" class="modal-close" data-close-modal aria-label="Close">✕</button>
      </div>
      <div class="modal-body">
        <p class="modal-lead">
          The <strong>Omnifón</strong> (meaning <em>“all sounds”</em>) is recognized as the <strong>first analog voltage-controlled synthesizer designed and built in Mexico</strong>, and one of the earliest instruments of its kind developed independently in Latin America alongside pioneers such as Robert Moog, Donald Buchla, Paolo Ketoff, and Erkki Kurenniemi.
        </p>

        <div class="modal-grid">
          <div class="modal-text">
            <h3>1. Pioneer & Origins (1958–1970)</h3>
            <p>
              Engineered by Mexican electrical/computing pioneer and composer <strong>Raúl Pavón Sarrelangue</strong> (1927–2008)—who authored Mexico’s first computing paper at a U.S. national conference in 1958 and studied electroacoustic music in Milan and Cologne—the project began after a 1958 <em>musique concrète</em> concert in Paris inspired him to build a 1-octave magnetic tape-loop keyboard.
            </p>
            <p>
              Between <strong>1960 and 1964</strong> (dated 1960 by Pavón and Ricardo Dal Farra; ~1964 by Gabriel Pareyón), Pavón built the first Omnifón prototype. Although local electronics manufacturers declined commercial production, his work led directly to the founding in <strong>1970</strong> of Mexico’s first <strong>Electronic Music Laboratory</strong> at the National Conservatory of Music (CNM) alongside composer Héctor Quintanar and backed by Carlos Chávez.
            </p>

            <h3>2. Two Stages Under One Name — and Disambiguation</h3>
            <ul>
              <li><strong>The 1960s Prototype:</strong> A compact voltage-controlled subtractive instrument featuring a remarkably pure continuous oscillator (<code>10 Hz – 20 kHz</code>, sine, square, and ramp waves), white noise, voltage-controlled filtering, envelope shaping, and keyboard control.</li>
              <li><strong>The 1981 Modular System:</strong> In his landmark book <em>La electrónica en la música… y en el arte</em> (CENIDIM, 1981, Ch. IV), Pavón expanded and documented the Omnifón as a complete didactic modular studio—featuring dual VCOs, ring modulation (<em>Mod. Anular</em>), stepped/smooth random generator (<em>Aleator</em>), voltage and 10-band octave filters (<em>Filtro-V</em>, <em>Filtro-O</em>), reverberation, pulser clock, and a 3×10 analog sequencer.</li>
              <li><strong>Not to be confused with the Icofón (1976):</strong> A separate audiovisual instrument created later by Pavón that translated sound into laser/oscilloscope color projections.</li>
            </ul>

            <h3>3. About This Virtual Reconstruction</h3>
            <p>
              Because the Omnifón was never mass-produced, <strong>no electronic circuit schematics, bills of materials, or certified dry recordings have been published</strong>. This web synthesizer is a <em>historically informed DSP reconstruction</em>: every module runs at audio rate inside its own <code>AudioWorkletProcessor</code>, faithfully following Pavón’s documented panel architecture, signal ranges, and patching workflow.
            </p>
            <div class="modal-fig-actions" style="margin-top:14px;">
              <a href="./investigacion.html" target="_blank" rel="noopener noreferrer" class="bar-btn" style="display:inline-flex;text-decoration:none;">
                Open Annex: Complete Documentary Research (Tables &amp; Graphics) →
              </a>
            </div>
          </div>

          <figure class="modal-figure">
            <img src="${imgSrc}" alt="Figura IV.38 Un ejemplo del alambrado en el omnifón — Raúl Pavón, 1981" />
            <figcaption>
              <strong>Figure IV.38 — “An example of wiring on the Omnifón”</strong><br />
              Original plate from Raúl Pavón Sarrelangue’s book <em>La electrónica en la música… y en el arte</em> (SEP / INBA-CENIDIM, Mexico, 1981). Notice how one voice pairs the 10-step melodic sequence and ring modulator through the octave filter bank, while a second voice routes pink noise into the voltage filter under programmed sequencer control.
              <div class="modal-fig-actions">
                <button type="button" class="bar-btn" data-load-fig>Load Preset #1 (Fig. IV.38)</button>
              </div>
            </figcaption>
          </figure>
        </div>

        <div class="modal-footer">
          <span>Virtual instrument created by <a href="https://www.instagram.com/laurorobles/" target="_blank" rel="noopener noreferrer">@laurorobles</a></span>
          <span>Sources: R. Pavón (CENIDIM, 1981) · R. Dal Farra (UQAM, 2006) · M. Rocha Iturbide · M. Matus Lerner (NIME, 2019)</span>
        </div>
      </div>
    `;
  }

  return `
    <div class="modal-header">
      <div>
        <p class="modal-kicker">Historia y contexto técnico</p>
        <h2>El Omnifón de Raúl Pavón Sarrelangue</h2>
      </div>
      <button type="button" class="modal-close" data-close-modal aria-label="Cerrar">✕</button>
    </div>
    <div class="modal-body">
      <p class="modal-lead">
        El <strong>Omnifón</strong> (<em>«todos los sonidos»</em>) es reconocido como el <strong>primer sintetizador analógico controlado por voltaje diseñado y construido en México</strong>, desarrollado de manera independiente en paralelo a los primeros instrumentos de Robert Moog, Donald Buchla, Paolo Ketoff y Erkki Kurenniemi.
      </p>

      <div class="modal-grid">
        <div class="modal-text">
          <h3>1. Pionero y origen (1958–1970)</h3>
          <p>
            Creado por el ingeniero electricista, pionero del cómputo y compositor mexicano <strong>Raúl Pavón Sarrelangue</strong> (1927–2008) —autor de la primera ponencia mexicana de computación en EE. UU. en 1958 y formado en los estudios electroacústicos de Milán y Colonia—, su búsqueda inició tras escuchar música concreta en París en 1958, construyendo primero un teclado de una octava basado en cintas magnéticas en bucle.
          </p>
          <p>
            Entre <strong>1960 y 1964</strong> (fechado en 1960 por Pavón y Ricardo Dal Farra; hacia 1964 por Gabriel Pareyón), Pavón diseñó y construyó el prototipo del Omnifón. Aunque la industria nacional no se interesó en fabricarlo comercialmente, este trabajo desembocó en la fundación en <strong>1970</strong> del primer <strong>Laboratorio de Música Electrónica</strong> de México en el Conservatorio Nacional de Música (CNM), junto con Héctor Quintanar y con el respaldo de Carlos Chávez.
          </p>

          <h3>2. Dos etapas bajo el mismo nombre (y deslinde histórico)</h3>
          <ul>
            <li><strong>El prototipo de los años 60:</strong> Sintetizador sustractivo controlado por voltaje con un oscilador continuo de gran pureza armónica (<code>10 Hz – 20 kHz</code> en ondas senoidal, cuadrada y rampa), generador de ruido blanco, filtro por voltaje, envolvente y teclado.</li>
            <li><strong>El sistema modular de 1981:</strong> En el capítulo IV de su libro fundamental <em>La electrónica en la música… y en el arte</em> (CENIDIM, 1981), Pavón sistematizó el Omnifón como un gabinete modular completo: doble oscilador, modulador anular (<em>Mod. Anular</em>), generador aleatorio (<em>Aleator</em>), filtro por voltaje (<em>Filtro-V</em>), banco de 10 octavas (<em>Filtro-O</em>), reverberador, reloj (<em>Pulsador</em>) y secuenciador analógico de 3×10 pasos.</li>
            <li><strong>Deslinde del Icofón (1976):</strong> Instrumento audiovisual distinto creado posteriormente por Pavón para traducir sonido electrónico en proyecciones cromáticas mediante osciloscopio.</li>
          </ul>

          <h3>3. Sobre esta reconstrucción virtual</h3>
          <p>
            Al tratarse de un desarrollo de taller no comercializado, <strong>no existen esquemáticos electrónicos de circuito ni grabaciones secas certificadas en fuentes públicas</strong>. Esta versión es una <em>reconstrucción históricamente informada en DSP</em>: cada módulo opera a frecuencia de audio en su propio <code>AudioWorkletProcessor</code>, respetando la arquitectura de paneles, rangos y flujo de alambrado documentados por su creador.
          </p>
          <div class="modal-fig-actions" style="margin-top:14px;">
            <a href="./investigacion.html" target="_blank" rel="noopener noreferrer" class="bar-btn" style="display:inline-flex;text-decoration:none;">
              Abrir Anexo: Investigación Documental Completa (Tablas y Gráficos) →
            </a>
          </div>
        </div>

        <figure class="modal-figure">
          <img src="${imgSrc}" alt="Figura IV.38 Un ejemplo del alambrado en el omnifón — Raúl Pavón, 1981" />
          <figcaption>
            <strong>Figura IV.38 — «Un ejemplo del alambrado en el omnifón»</strong><br />
            Lámina original del libro <em>La electrónica en la música… y en el arte</em> de Raúl Pavón Sarrelangue (SEP / INBA-CENIDIM, México, 1981). En este parche documental, una voz articula la secuencia melódica y la modulación anular a través del banco de octavas, mientras una segunda voz procesa ruido rosa con filtrado programado desde el secuenciador.
            <div class="modal-fig-actions">
              <button type="button" class="bar-btn" data-load-fig>Cargar Preset #1 (Fig. IV.38)</button>
            </div>
          </figcaption>
        </figure>
      </div>

      <div class="modal-footer">
        <span>Recreación virtual desarrollada por <a href="https://www.instagram.com/laurorobles/" target="_blank" rel="noopener noreferrer">@laurorobles</a></span>
        <span>Fuentes: R. Pavón (CENIDIM, 1981) · R. Dal Farra (UQAM, 2006) · M. Rocha Iturbide · M. Matus Lerner (NIME, 2019)</span>
      </div>
    </div>
  `;
}

export function renderManualModal(lang: Lang, hardwareImgSrc: string): string {
  if (lang === 'en') {
    return `
      <div class="modal-header">
        <div>
          <p class="modal-kicker">Interactive Guide & User Manual</p>
          <h2>Omnifón Virtual · Complete Operating Guide</h2>
        </div>
        <button type="button" class="modal-close" data-close-modal aria-label="Close">✕</button>
      </div>
      <div class="modal-body manual-content">
        <div class="manual-hero">
          <img src="${hardwareImgSrc}" alt="Original Omnifón Hardware Console" class="manual-hero-img" />
          <div class="manual-hero-caption">
            <strong>Recreation vs. Original Hardware:</strong> Front view of the Omnifón synthesizer built by Raúl Pavón Sarrelangue (CENIDIM, Mexico). Notice the exact 14-module layout, panel typography, and control arrangements replicated in this software.
          </div>
        </div>

        <nav class="manual-quick-nav">
          <a href="#man-quickstart">1. Quickstart</a>
          <a href="#man-gestures">2. Controls & Patching</a>
          <a href="#man-modules">3. Module Reference</a>
          <a href="#man-patches">4. Included Patches</a>
          <a href="#man-vst">5. VST Roadmap</a>
        </nav>

        <section id="man-quickstart" class="manual-section">
          <h3>1. Quickstart Guide</h3>
          <div class="steps-grid">
            <div class="step-card">
              <span class="step-num">1</span>
              <h4>Power On Audio</h4>
              <p>Click <strong>Power On</strong> in the top bar. The red indicator lamp will illuminate and the Web Audio DSP engine will immediately activate.</p>
            </div>
            <div class="step-card">
              <span class="step-num">2</span>
              <h4>Audition 8 Patches</h4>
              <p>Click on any button in the <strong>Patches</strong> bar. Patch #1 is the historic <strong>Fig. IV.38</strong> layout. Use patches #2 or #6 to play melodies directly from the keyboard.</p>
            </div>
            <div class="step-card">
              <span class="step-num">3</span>
              <h4>Play Notes</h4>
              <p>Use your mouse on the 5-octave keybed, computer keys (<kbd>A</kbd>–<kbd>;</kbd>), or connect any USB/Bluetooth MIDI keyboard (Web MIDI auto-detects instantly).</p>
            </div>
          </div>
        </section>

        <section id="man-gestures" class="manual-section">
          <h3>2. Patch Cables & Control Gestures</h3>
          <div class="manual-grid-2col">
            <div class="manual-panel-box">
              <h4>Connecting & Unpatching</h4>
              <ul>
                <li><strong>Draw Cable:</strong> Click & drag from any jack (input or output). Connecting to an already occupied input will replace it cleanly.</li>
                <li><strong>Unplug Cable:</strong> Click and drag from an <em>occupied input jack</em> and release in empty space to remove it.</li>
                <li><strong>Multiple Destinations:</strong> Any output jack can feed multiple inputs simultaneously.</li>
                <li><strong>Dim Cables:</strong> Click <strong>Dim Cables</strong> in the top header to make wires translucent while adjusting knobs.</li>
              </ul>
            </div>
            <div class="manual-panel-box">
              <h4>Knob & Slider Manipulation</h4>
              <ul>
                <li><strong>Knobs:</strong> Drag vertically or use mouse wheel.</li>
                <li><strong>Fine Tune:</strong> Hold <kbd>Shift</kbd> while dragging for high-precision tuning.</li>
                <li><strong>Reset:</strong> Double-click any knob or slider to return to its default position.</li>
                <li><strong>O-Filter Sliders:</strong> Horizontal faders control 10 individual octave bands plus Master Sum.</li>
              </ul>
            </div>
          </div>
        </section>

        <section id="man-modules" class="manual-section">
          <h3>3. Visual Module Reference (14 Units)</h3>
          
          <div class="module-cards-flow">
            <div class="module-card">
              <div class="module-badge">Row 1 · Audio & FX</div>
              <h4>ENVOLVEDOR (VCA)</h4>
              <p>Voltage-controlled dual amplifier. <code>Entrada 1</code> sets baseline bleed; <code>Entrada 2</code> sets dynamic gain governed by envelope CV.</p>
            </div>

            <div class="module-card">
              <div class="module-badge">Row 1 · Random</div>
              <h4>ALEATOR (Random S&H)</h4>
              <p>Stepped & smooth voltage generator. Oscillates autonomously or samples new values upon incoming pulse triggers.</p>
            </div>

            <div class="module-card">
              <div class="module-badge">Row 1 · FX</div>
              <h4>MOD. ANULAR (Ring Modulator)</h4>
              <p>Four-quadrant analog multiplier creating metallic sidebands and inharmonic bell partials with internal or external carrier.</p>
            </div>

            <div class="module-card">
              <div class="module-badge">Row 1 · Source</div>
              <h4>RUIDOR (Noise Source)</h4>
              <p>Calibrated noise generator providing simultaneous flat <strong>White</strong> and −3dB/oct <strong>Pink</strong> noise outputs.</p>
            </div>

            <div class="module-card">
              <div class="module-badge">Row 1 · FX</div>
              <h4>REVERBERAL (Dual Spring Reverb)</h4>
              <p>Summing reverb processor with dedicated <code>intensidad</code> (wet/dry depth) and <code>tiempo</code> (dispersion decay) controls.</p>
            </div>

            <div class="module-card">
              <div class="module-badge">Row 2 · Modulation</div>
              <h4>INTEGRADOR ENVOLV. (Trapezoidal Env)</h4>
              <p>3-stage envelope: <code>ataque</code>, <code>duración</code> (hold), and <code>decaimiento</code> (decay). Toggle <code>ext.</code> for gate triggers or <code>int.</code> for continuous trapezoidal LFO cycling.</p>
            </div>

            <div class="module-card">
              <div class="module-badge">Row 2 · Audio Core</div>
              <h4>OSCILADOR 1 & 2 (Dual VCOs)</h4>
              <p>Continuous 5Hz–20kHz oscillators with Sine (<code>∿</code>), Triangle (<code>∧</code>), Ramp (<code>⩘</code>), and Variable Pulse (<code>⊓</code>). Includes linear/exponential FM inputs with Direct/Rectified selector.</p>
            </div>

            <div class="module-card">
              <div class="module-badge">Row 2 · Filter</div>
              <h4>FILTRO-V (Voltage-Controlled Filter)</h4>
              <p>State-variable filter with simultaneous Low-pass (<code>baj.</code>), High-pass (<code>alt.</code>), and Band-pass (<code>banda</code>) outputs, resonance bandwidth control, and center CV modulation.</p>
            </div>

            <div class="module-card">
              <div class="module-badge">Row 2 · Filter Bank</div>
              <h4>FILTRO-O (10-Band Octave Bank)</h4>
              <p>Fixed-Q inductor-style filter bank at 25, 50, 100, 200, 400, 800, 1.6k, 3.2k, 6.5k, and 13kHz, each with individual direct output tap and master Sum slider.</p>
            </div>

            <div class="module-card">
              <div class="module-badge">Row 3 · Timing</div>
              <h4>PULSADOR (Master Clock)</h4>
              <p>Variable pulse train generator (0.1Hz – 40Hz) with Start/Stop push buttons, pulse width CV, and anti-phase inverted pulse output.</p>
            </div>

            <div class="module-card">
              <div class="module-badge">Row 3 · Matrix</div>
              <h4>S E C U E N C I A D O R (3×10 Sequencer)</h4>
              <p>10-step, 3-row CV matrix. Row 1 is quantized to musical semitones; Rows 2 & 3 provide continuous microtonal voltages. Jump/loop any step by cabling step outputs to <code>reinicio</code>.</p>
            </div>

            <div class="module-card">
              <div class="module-badge">Bottom · Input & Output</div>
              <h4>TECLADO & SALIDA</h4>
              <p>5-octave keybed with adjustable glide portamento and pitch CV + gate. Master output stage includes volume limiter and real-time CRT-style oscilloscope.</p>
            </div>
          </div>
        </section>

        <section id="man-patches" class="manual-section">
          <h3>4. Factory Patches & Patching Recipes</h3>
          <div class="patches-overview-grid">
            <div class="patch-guide-item">
              <strong>1 · Fig. IV.38:</strong> Raúl Pavón’s exact 1981 CENIDIM book diagram. Dual-voice arrangement: ring-modulated sequence through octave filter bank, plus stepped noise bursts on Filtro-V.
            </div>
            <div class="patch-guide-item">
              <strong>2 · Teclado:</strong> Expressive lead voice ready to play from keyboard or MIDI. Features gentle vibrato from OSC 2 and stereo spring reverb.
            </div>
            <div class="patch-guide-item">
              <strong>3 · Bajo 8p:</strong> Hypnotic 8-step analog bassline with automated filter resonance modulation per step.
            </div>
            <div class="patch-guide-item">
              <strong>4 · Campanas:</strong> Algorithmic bell chimes in 7/8 time using cross-coupled ring modulation and formant peaks.
            </div>
            <div class="patch-guide-item">
              <strong>5 · Aleatorio:</strong> Self-generating ambient soundscape driven by cyclical trapezoid envelopes and pseudo-random voltages.
            </div>
            <div class="patch-guide-item">
              <strong>6 · Formantes:</strong> Vocal choral synthesizer mimicking human vowels (A, E, I, O, U) playable poly-tonally via keyboard CV.
            </div>
            <div class="patch-guide-item">
              <strong>7 · Percusión:</strong> 10-step analog drum groove with punchy kick transients and metallic noise hats.
            </div>
            <div class="patch-guide-item">
              <strong>8 · Cosmos:</strong> Deep space drone combining slow FM sweeps, high-resonance self-oscillation, and expansive stereo reverb.
            </div>
          </div>
        </section>

        <section id="man-vst" class="manual-section">
          <h3>5. Native VST / AU / CLAP Roadmap</h3>
          <p>
            A dedicated porting initiative is underway to bring the Omnifón into digital audio workstations (DAWs) as a 64-bit VST3, Audio Unit, and CLAP plugin using JUCE and C++20. For technical details, parameter tree architecture, and release milestones, consult the official <a href="https://github.com/laurorobles/Omnifon/blob/main/docs/ROADMAP_VST.md" target="_blank" rel="noopener noreferrer">VST Roadmap in the GitHub repository</a>.
          </p>
        </section>

        <div class="modal-footer">
          <span>Omnifón Virtual created by <a href="https://www.instagram.com/laurorobles/" target="_blank" rel="noopener noreferrer">@laurorobles</a></span>
          <span>Source Code: <a href="https://github.com/laurorobles/Omnifon" target="_blank" rel="noopener noreferrer">github.com/laurorobles/Omnifon</a></span>
        </div>
      </div>
    `;
  }

  return `
    <div class="modal-header">
      <div>
        <p class="modal-kicker">Guía interactiva y manual de usuario</p>
        <h2>Omnifón Virtual · Manual Completo de Uso</h2>
      </div>
      <button type="button" class="modal-close" data-close-modal aria-label="Cerrar">✕</button>
    </div>
    <div class="modal-body manual-content">
      <div class="manual-hero">
        <img src="${hardwareImgSrc}" alt="Gabinete original del Omnifón de Raúl Pavón" class="manual-hero-img" />
        <div class="manual-hero-caption">
          <strong>Aparato original vs. Recreación virtual:</strong> Fotografía frontal del sintetizador Omnifón construido por Raúl Pavón Sarrelangue (CENIDIM, México). Observa la correspondencia idéntica de sus 14 módulos, tipografías, selectores y controles reproducidos en esta recreación.
        </div>
      </div>

      <nav class="manual-quick-nav">
        <a href="#man-quickstart">1. Inicio rápido</a>
        <a href="#man-gestures">2. Cables y controles</a>
        <a href="#man-modules">3. Módulos explicados</a>
        <a href="#man-patches">4. Los 8 parches</a>
        <a href="#man-vst">5. Plan VST</a>
      </nav>

      <section id="man-quickstart" class="manual-section">
        <h3>1. Inicio rápido en 3 pasos</h3>
        <div class="steps-grid">
          <div class="step-card">
            <span class="step-num">1</span>
            <h4>Encender el audio</h4>
            <p>Haz clic en el botón <strong>Encender</strong> en la barra superior. La lámpara roja se iluminará y el motor de síntesis Web Audio comenzará a sonar de inmediato.</p>
          </div>
          <div class="step-card">
            <span class="step-num">2</span>
            <h4>Explorar los 8 parches</h4>
            <p>Haz clic en cualquiera de los botones de la barra <strong>Parches</strong>. El preset #1 es la recreación exacta de la <strong>Fig. IV.38</strong> del libro de 1981. Para tocar melodías libres, elige <strong>2 · Teclado</strong>.</p>
          </div>
          <div class="step-card">
            <span class="step-num">3</span>
            <h4>Tocar notas y experimentar</h4>
            <p>Toca con el ratón o pantalla táctil en el teclado de 5 octavas, usa tu teclado de computadora (<kbd>A</kbd>–<kbd>Ñ</kbd>) o conecta un controlador MIDI USB (se detecta automáticamente).</p>
          </div>
        </div>
      </section>

      <section id="man-gestures" class="manual-section">
        <h3>2. Alambrado de cables y gestos de control</h3>
        <div class="manual-grid-2col">
          <div class="manual-panel-box">
            <h4>Conexión y desconexión de cables</h4>
            <ul>
              <li><strong>Tender un cable:</strong> Haz clic y arrastra desde cualquier conector (entrada o salida). Al soltar sobre otro conector compatible se enlazará automáticamente.</li>
              <li><strong>Desenchufar / mover:</strong> Haz clic sobre una <em>entrada ocupada</em> y arrastra. Si sueltas en un área vacía el cable se elimina; si lo llevas a otra entrada se reubica.</li>
              <li><strong>Múltiples destinos:</strong> Una sola salida puede alimentar simultáneamente varias entradas (distribución pasiva mult).</li>
              <li><strong>Atenuar cables:</strong> Pulsa el botón <strong>Atenuar cables</strong> en la barra superior para hacer transparentes los cables y poder ver y ajustar perillas con total comodidad.</li>
            </ul>
          </div>
          <div class="manual-panel-box">
            <h4>Perillas, deslizadores y pulsadores</h4>
            <ul>
              <li><strong>Perillas (knobs):</strong> Arrastre vertical continuo o rueda del ratón. Tienen diseño analógico estriado en negro mate y blanco crema.</li>
              <li><strong>Ajuste fino:</strong> Mantén pulsada la tecla <kbd>Shift</kbd> mientras arrastras para ajuste micrométrico.</li>
              <li><strong>Restablecer:</strong> Haz <strong>doble clic</strong> en cualquier perilla o deslizador para devolverlo a su valor calibrado inicial.</li>
              <li><strong>Deslizadores (Filtro-O):</strong> Arrastre horizontal para calibrar individualmente las 10 bandas de octava y la suma general.</li>
            </ul>
          </div>
        </div>
      </section>

      <section id="man-modules" class="manual-section">
        <h3>3. Guía visual de los 14 módulos</h3>
        
        <div class="module-cards-flow">
          <div class="module-card">
            <div class="module-badge">Fila 1 · Audio y Dinámica</div>
            <h4>ENVOLVEDOR (VCA)</h4>
            <p>Amplificador controlado por voltaje. <code>Entrada 1</code> define la fuga o volumen directo constante; <code>Entrada 2</code> modula la ganancia dinámica mediante voltaje de envolvente.</p>
          </div>

          <div class="module-card">
            <div class="module-badge">Fila 1 · Aleatoriedad</div>
            <h4>ALEATOR (Sample & Hold)</h4>
            <p>Generador aleatorio de doble salida: <code>Escalón</code> (voltajes discretos escalonados) y <code>Suave</code> (curva continua filtrada). Oscila de forma autónoma o sincronizado a reloj externo.</p>
          </div>

          <div class="module-card">
            <div class="module-badge">Fila 1 · Efectos</div>
            <h4>MOD. ANULAR (Ring Modulator)</h4>
            <p>Multiplicador analógico de cuatro cuadrantes. Produce timbres metálicos, campanas y parciales inarmónicos combinando señales externas o su portadora interna de 220 Hz.</p>
          </div>

          <div class="module-card">
            <div class="module-badge">Fila 1 · Fuentes</div>
            <h4>RUIDOR (Generador de Ruido)</h4>
            <p>Fuente de ruido térmico calibrado con salidas simultáneas de <strong>ruido blanco</strong> (espectro plano uniforme) y <strong>ruido rosa</strong> (−3 dB/octava, ideal para percusiones o viento).</p>
          </div>

          <div class="module-card">
            <div class="module-badge">Fila 1 · Acústica</div>
            <h4>REVERBERAL (Reverberador Doble)</h4>
            <p>Unidad de reverberación con 2 entradas sumadas, control de <code>intensidad</code> (mezcla seca/procesada) y <code>tiempo</code> (longitud de decaimiento espacial en sala).</p>
          </div>

          <div class="module-card">
            <div class="module-badge">Fila 2 · Envolventes</div>
            <h4>INTEGRADOR ENVOLV. (Generador Trapezoidal)</h4>
            <p>Generador de envolvente de 3 fases: <code>ataque</code>, <code>duración</code> (retención en pico) y <code>decaimiento</code>. El selector <code>ext./int.</code> conmuta entre disparo por pulso o bucle LFO autónomo.</p>
          </div>

          <div class="module-card">
            <div class="module-badge">Fila 2 · Núcleo Sonoro</div>
            <h4>OSCILADOR 1 y 2 (Doble VCO)</h4>
            <p>Generadores continuos de 5 Hz a 20 kHz con salidas simultáneas Senoidal (<code>∿</code>), Triangular (<code>∧</code>), Rampa (<code>⩘</code>) y Pulso (<code>⊓</code>) con ancho de pulso variable. Incluyen FM directa o rectificada.</p>
          </div>

          <div class="module-card">
            <div class="module-badge">Fila 2 · Filtrado</div>
            <h4>FILTRO-V (Filtro por Voltaje)</h4>
            <p>Filtro de estado variable con salidas simultáneas Pasa-Bajos (<code>baj.</code>), Pasa-Altos (<code>alt.</code>) y Pasa-Banda (<code>banda</code>), resonancia controlada por voltaje y perilla de frecuencia <code>Centro</code>.</p>
          </div>

          <div class="module-card">
            <div class="module-badge">Fila 2 · Banco Espectral</div>
            <h4>FILTRO-O (Banco de 10 Octavas)</h4>
            <p>Banco fijo de filtros ecualizadores centrados en 25, 50, 100, 200, 400, 800, 1.6k, 3.2k, 6.5k y 13 kHz. Cada banda tiene salida directa propia y un fader de mezcla maestra <code>Suma</code>.</p>
          </div>

          <div class="module-card">
            <div class="module-badge">Fila 3 · Reloj</div>
            <h4>PULSADOR (Reloj Maestro)</h4>
            <p>Generador de tren de pulsos (0.1 a 40 Hz) con botones metálicos de marcha/paro (<code>inicio</code> / <code>fin</code>), control de ancho de pulso y salida invertida en antifase.</p>
          </div>

          <div class="module-card">
            <div class="module-badge">Fila 3 · Programación</div>
            <h4>S E C U E N C I A D O R (Matriz de 3 × 10 Pasos)</h4>
            <p>Secuenciador analógico de 10 pasos con 3 filas de perillas. La Fila 1 está cuantizada musicalmente en semitonos; Filas 2 y 3 entregan voltajes continuos. Permite crear bucles de cualquier longitud conectando el paso deseado a <code>reinicio</code>.</p>
          </div>

          <div class="module-card">
            <div class="module-badge">Consola Inferior · Control y Salida</div>
            <h4>TECLADO y SALIDA</h4>
            <p>Teclado de 5 octavas con portamento deslizable suave y salidas de voltaje y compuerta. La etapa de salida maestra integra control de volumen, limitador suave y un osciloscopio en tiempo real estilo CRT.</p>
          </div>
        </div>
      </section>

      <section id="man-patches" class="manual-section">
        <h3>4. Banco de 8 parches de fábrica</h3>
        <div class="patches-overview-grid">
          <div class="patch-guide-item">
            <strong>1 · Fig. IV.38:</strong> La configuración histórica exacta documentada en el libro de Raúl Pavón (1981): voz dual que combina modulación anular, filtrado en banco de octavas y ruido rosa modulado por pasos.
          </div>
          <div class="patch-guide-item">
            <strong>2 · Teclado:</strong> Sintetizador sustractivo melódico listo para tocarse con teclado o MIDI, enriquecido con vibrato sutil y reverberación analógica.
          </div>
          <div class="patch-guide-item">
            <strong>3 · Bajo 8p:</strong> Secuencia de bajo analógico en 8 pasos con onda de pulso incisiva y resonancia modulada en cada paso.
          </div>
          <div class="patch-guide-item">
            <strong>4 · Campanas:</strong> Metalofonía tímbrica electroacústica en métrica de 7 pasos mediante multiplicación anular de ambos osciladores.
          </div>
          <div class="patch-guide-item">
            <strong>5 · Aleatorio:</strong> Pieza generativa autómata donde el generador trapezoidal se autodispara y modula parámetros de aleatoriedad continua.
          </div>
          <div class="patch-guide-item">
            <strong>6 · Formantes:</strong> Banco vocal sintetizado emulando vocales humanas que pueden entonarse melódicamente con el teclado.
          </div>
          <div class="patch-guide-item">
            <strong>7 · Percusión:</strong> Batería analógica secuenciada combinando transitorios contundentes de bombo y ráfagas de ruido blanco para platillos.
          </div>
          <div class="patch-guide-item">
            <strong>8 · Cosmos:</strong> Paisaje sonoro envolvente de ciencia ficción con modulaciones cruzadas de frecuencia, resonancia límite y reverberación profunda.
          </div>
        </div>
      </section>

      <section id="man-vst" class="manual-section">
        <h3>5. Plan de trabajo y versión VST</h3>
        <p>
          Existe un plan de desarrollo detallado para trasladar este motor DSP de precisión a formatos nativos de plugin de audio para estaciones de trabajo (DAWs como Ableton, Logic, Pro Tools, Reaper y FL Studio) en <strong>VST3, AU y CLAP</strong> utilizando C++ y el framework JUCE. Puedes consultar el plan técnico completo en el archivo <a href="https://github.com/laurorobles/Omnifon/blob/main/docs/ROADMAP_VST.md" target="_blank" rel="noopener noreferrer">ROADMAP_VST.md en el repositorio de GitHub</a>.
        </p>
      </section>

      <div class="modal-footer">
        <span>Omnifón Virtual desarrollado por <a href="https://www.instagram.com/laurorobles/" target="_blank" rel="noopener noreferrer">@laurorobles</a></span>
        <span>Código fuente y documentación: <a href="https://github.com/laurorobles/Omnifon" target="_blank" rel="noopener noreferrer">github.com/laurorobles/Omnifon</a></span>
      </div>
    </div>
  `;
}
