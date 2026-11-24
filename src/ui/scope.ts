/** Osciloscopio de fósforo verde con disparo por cruce ascendente. */
export function createScope(canvas: HTMLCanvasElement, getAnalyser: () => AnalyserNode | null) {
  const ctx = canvas.getContext('2d')!;
  let buf = new Float32Array(4096);
  let externalBuf: Float32Array | null = null;
  let span = 1024; // muestras visibles

  const resize = () => {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
  };
  new ResizeObserver(resize).observe(canvas);
  resize();

  const grid = () => {
    const { width: W, height: H } = canvas;
    ctx.strokeStyle = 'rgba(120, 255, 170, 0.10)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 1; i < 10; i++) {
      ctx.moveTo((W * i) / 10, 0);
      ctx.lineTo((W * i) / 10, H);
    }
    for (let i = 1; i < 8; i++) {
      ctx.moveTo(0, (H * i) / 8);
      ctx.lineTo(W, (H * i) / 8);
    }
    ctx.stroke();
  };

  const draw = () => {
    requestAnimationFrame(draw);
    const { width: W, height: H } = canvas;
    // persistencia del fósforo
    ctx.fillStyle = 'rgba(6, 18, 12, 0.35)';
    ctx.fillRect(0, 0, W, H);
    grid();
    const a = getAnalyser();
    let src: Float32Array | null = null;
    let visible = span;
    if (a) {
      if (buf.length !== a.fftSize) buf = new Float32Array(a.fftSize);
      a.getFloatTimeDomainData(buf);
      src = buf;
    } else if (externalBuf && externalBuf.length > 4) {
      src = externalBuf;
      visible = Math.min(span, externalBuf.length);
    }
    if (!src) return;

    let start = 0;
    for (let i = 1; i < src.length - visible; i++) {
      if (src[i - 1] < 0 && src[i] >= 0) {
        start = i;
        break;
      }
    }
    ctx.lineWidth = 2 * (window.devicePixelRatio || 1);
    ctx.strokeStyle = '#7dffb0';
    ctx.shadowColor = '#3dff8a';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    for (let i = 0; i < visible; i++) {
      const x = (i / (visible - 1)) * W;
      const y = H / 2 - src[start + i] * H * 0.45;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
  };
  requestAnimationFrame(draw);

  return {
    setSpan: (s: number) => {
      span = s;
    },
    pushSamples: (samples: number[]) => {
      if (!externalBuf || externalBuf.length !== samples.length) {
        externalBuf = new Float32Array(samples.length);
      }
      for (let i = 0; i < samples.length; i++) externalBuf[i] = samples[i];
    },
  };
}
