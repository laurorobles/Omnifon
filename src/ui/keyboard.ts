const NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
const BLACK = new Set([1, 3, 6, 8, 10]);

/** Mapeo del teclado de computadora (fila ASDF = teclas blancas). */
const KEYMAP: Record<string, number> = {
  a: 0, w: 1, s: 2, e: 3, d: 4, f: 5, t: 6, g: 7, y: 8, h: 9, u: 10, j: 11,
  k: 12, o: 13, l: 14, p: 15, ñ: 16, ';': 16,
};

export interface KeyboardHandlers {
  noteOn: (n: number) => void;
  noteOff: (n: number) => void;
}

/** Teclado tradicional de 5 octavas (61 teclas, C1–C6), como la Fig. IV.20. */
export function createKeyboard(container: HTMLElement, h: KeyboardHandlers, first = 24, last = 84) {
  const keys = new Map<number, HTMLElement>();
  const whites = [];
  for (let n = first; n <= last; n++) if (!BLACK.has(n % 12)) whites.push(n);
  const w = 100 / whites.length;

  let wi = 0;
  for (let n = first; n <= last; n++) {
    const k = document.createElement('div');
    const black = BLACK.has(n % 12);
    k.className = black ? 'key black' : 'key white';
    k.dataset.note = String(n);
    k.title = `${NAMES[n % 12]}${Math.floor(n / 12) - 1}`;
    if (black) {
      k.style.left = `${wi * w - w * 0.32}%`;
      k.style.width = `${w * 0.64}%`;
    } else {
      k.style.left = `${wi * w}%`;
      k.style.width = `${w}%`;
      if (n % 12 === 0) k.innerHTML = `<span>C${Math.floor(n / 12) - 1}</span>`;
      wi++;
    }
    container.appendChild(k);
    keys.set(n, k);
  }

  const active = new Set<number>();
  const press = (n: number) => {
    if (active.has(n)) return;
    active.add(n);
    keys.get(n)?.classList.add('down');
    h.noteOn(n);
  };
  const release = (n: number) => {
    if (!active.has(n)) return;
    active.delete(n);
    keys.get(n)?.classList.remove('down');
    h.noteOff(n);
  };

  // Ratón / táctil con glissando
  let pointerNote: number | null = null;
  const noteAt = (x: number, y: number) => {
    const el = document.elementFromPoint(x, y) as HTMLElement | null;
    const n = el?.closest<HTMLElement>('.key')?.dataset.note;
    return n === undefined ? null : Number(n);
  };
  container.addEventListener('pointerdown', (e) => {
    container.setPointerCapture(e.pointerId);
    pointerNote = noteAt(e.clientX, e.clientY);
    if (pointerNote !== null) press(pointerNote);
  });
  container.addEventListener('pointermove', (e) => {
    if (pointerNote === null) return;
    const n = noteAt(e.clientX, e.clientY);
    if (n !== null && n !== pointerNote) {
      release(pointerNote);
      pointerNote = n;
      press(n);
    }
  });
  const up = () => {
    if (pointerNote !== null) release(pointerNote);
    pointerNote = null;
  };
  container.addEventListener('pointerup', up);
  container.addEventListener('pointercancel', up);

  // Teclado de computadora
  let octave = 48;
  const octaveLabel = document.getElementById('octave-label');
  const showOctave = () => {
    if (octaveLabel) octaveLabel.textContent = `C${octave / 12 - 1}`;
  };
  showOctave();
  const typed = new Map<string, number>();
  window.addEventListener('keydown', (e) => {
    if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
    if ((e.target as HTMLElement).tagName === 'INPUT') return;
    const key = e.key.toLowerCase();
    if (key === 'z' || key === 'x') {
      octave = Math.min(72, Math.max(24, octave + (key === 'z' ? -12 : 12)));
      showOctave();
      return;
    }
    const off = KEYMAP[key];
    if (off === undefined) return;
    const n = octave + off;
    typed.set(key, n);
    press(n);
  });
  window.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    const n = typed.get(key);
    if (n === undefined) return;
    typed.delete(key);
    release(n);
  });
  window.addEventListener('blur', () => {
    [...active].forEach(release);
    typed.clear();
  });

  return { press, release };
}
