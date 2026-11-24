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
  'Entrada A': 'Input A',
  'Entrada B': 'Input B',
  'Control': 'Control',
  'Mínimo': 'Min',
  'Máximo': 'Max',
  'Escalón': 'Stepped',
  'Suave': 'Smooth',
  'Velocidad': 'Rate',
  'Nivel': 'Level',
  'Portadora': 'Carrier',
  'Blanco': 'White',
  'Rosa': 'Pink',
  'Intensidad': 'Mix',
  'Tiempo': 'Decay',
  'Pulso': 'Pulse',
  'Inversa': 'Inverted',
  'Inverso': 'Inverted',
  'Ataque': 'Attack',
  'Decaimiento': 'Decay',
  'Sostén': 'Sustain',
  'Extinción': 'Release',
  'Frecuencia': 'Frequency',
  'Modulador': 'Modulator',
  'Ancho': 'Width',
  'Aj. fino': 'Fine tune',
  'Senoidal': 'Sine',
  'Triangular': 'Triangle',
  'Rampa': 'Ramp',
  'Cuadrada': 'Square',
  'Modulación': 'Modulation',
  'Bajos': 'Low',
  'Banda': 'Band',
  'Altos': 'High',
  'Centro': 'Center',
  'Suma': 'Sum',
  'Inicio': 'Start',
  'Fin': 'Stop',
  'Pulsos 1': 'Pulses 1',
  'Pulsos 2': 'Pulses 2',
  'Reloj': 'Clock',
  'Marcha': 'Run',
  'Reinicio': 'Reset',
  'Fila A': 'Row A',
  'Fila B': 'Row B',
  'Fila C': 'Row C',
  'Pasos': 'Steps',
  'Libre': 'Free',
  'Semitono': 'Semitone',
  'Voltaje': 'Voltage',
  'Portamento': 'Glide',
  'Izquierda': 'Left',
  'Derecha': 'Right',
  'Volumen': 'Volume',

  // Marcas de escala
  'mín.': 'min.',
  'máx.': 'max.',
  'seg.': 'sec.',

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
  info: string;
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
    presets: 'Presets',
    dimCables: 'Atenuar cables',
    info: 'Información',
    powerOn: 'Encender',
    powerOff: 'Activo',
    keysHintHtml:
      'Teclas <kbd>A</kbd>–<kbd>Ñ</kbd><br><kbd>Z</kbd>/<kbd>X</kbd> octava: <b id="octave-label">C3</b>',
    footerHtml:
      'Arrastra desde un conector para tender un cable · arrastra desde una entrada ocupada para desconectar · ' +
      'perillas: arrastre vertical (Shift = fino, doble clic = inicial).<br />' +
      'Reconstrucción históricamente informada del Omnifón (c. 1960–64 / 1981). No es una emulación de circuito: no existen esquemáticos publicados.',
    close: 'Cerrar',
    loadFigPreset: 'Cargar preset Fig. IV.38',
    audioError: 'No se pudo iniciar el audio: ',
  },
  en: {
    subtitle: 'Raúl Pavón Sarrelangue · Mexico · c. 1960',
    byLabel: 'Virtual recreation by',
    presets: 'Presets',
    dimCables: 'Dim cables',
    info: 'History & Info',
    powerOn: 'Power On',
    powerOff: 'Running',
    keysHintHtml:
      'Keys <kbd>A</kbd>–<kbd>;</kbd><br><kbd>Z</kbd>/<kbd>X</kbd> octave: <b id="octave-label">C3</b>',
    footerHtml:
      'Drag from any jack to patch a cable · drag from an occupied input to unplug · ' +
      'knobs: vertical drag (Shift = fine, double-click = reset).<br />' +
      'Historically informed reconstruction of the Omnifón (c. 1960–64 / 1981). Not a circuit-level clone: no schematics have been published.',
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
