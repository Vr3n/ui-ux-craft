// Dependency-free colour maths shared by the ui-ux-craft scripts.
// WCAG 2.x contrast, APCA (SAPC 0.98G), and OKLCH helpers.

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export function parseColor(input) {
  const s = String(input).trim().toLowerCase();
  let m;
  if ((m = s.match(/^#([0-9a-f]{3,8})$/))) {
    let h = m[1];
    if (h.length === 3 || h.length === 4) h = [...h].map((c) => c + c).join('');
    if (h.length !== 6 && h.length !== 8) return null;
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
      a: h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1,
    };
  }
  if ((m = s.match(/^rgba?\(\s*([\d.]+%?)[\s,]+([\d.]+%?)[\s,]+([\d.]+%?)(?:[\s,/]+([\d.]+%?))?\s*\)$/))) {
    const ch = (v) => (v.endsWith('%') ? (parseFloat(v) / 100) * 255 : parseFloat(v));
    const al = m[4] === undefined ? 1 : m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
    return { r: clamp(ch(m[1]), 0, 255), g: clamp(ch(m[2]), 0, 255), b: clamp(ch(m[3]), 0, 255), a: clamp(al, 0, 1) };
  }
  if ((m = s.match(/^hsla?\(\s*([\d.]+)(?:deg)?[\s,]+([\d.]+)%[\s,]+([\d.]+)%(?:[\s,/]+([\d.]+%?))?\s*\)$/))) {
    const h = ((parseFloat(m[1]) % 360) + 360) % 360, sat = parseFloat(m[2]) / 100, l = parseFloat(m[3]) / 100;
    const k = (n) => (n + h / 30) % 12;
    const a = sat * Math.min(l, 1 - l);
    const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    const al = m[4] === undefined ? 1 : m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
    return { r: f(0) * 255, g: f(8) * 255, b: f(4) * 255, a: clamp(al, 0, 1) };
  }
  const named = { white: '#ffffff', black: '#000000', transparent: '#00000000' };
  if (named[s]) return parseColor(named[s]);
  return null;
}

export function toHex({ r, g, b }) {
  const h = (v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`.toUpperCase();
}

// Put a translucent colour on top of an opaque backdrop.
export function over(fg, bg) {
  const a = fg.a ?? 1;
  return { r: fg.r * a + bg.r * (1 - a), g: fg.g * a + bg.g * (1 - a), b: fg.b * a + bg.b * (1 - a), a: 1 };
}

// ---------- WCAG 2.x ----------
const lin = (v) => {
  const c = v / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};
export function luminance({ r, g, b }) {
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}
export function wcagRatio(fg, bg) {
  const l1 = luminance(over(fg, bg)), l2 = luminance(bg);
  const hi = Math.max(l1, l2), lo = Math.min(l1, l2);
  return (hi + 0.05) / (lo + 0.05);
}

// ---------- APCA (SAPC 0.98G-4g constants) ----------
const apcaY = ({ r, g, b }) => {
  const f = (v) => (v / 255) ** 2.4;
  let y = 0.2126729 * f(r) + 0.7151522 * f(g) + 0.072175 * f(b);
  if (y < 0.022) y += (0.022 - y) ** 1.414;
  return y;
};
// Returns signed Lc. Positive = dark text on light bg, negative = light text on dark bg.
export function apcaLc(fg, bg) {
  const yt = apcaY(over(fg, bg)), yb = apcaY(bg);
  if (Math.abs(yb - yt) < 0.0005) return 0;
  if (yb > yt) {
    const s = (yb ** 0.56 - yt ** 0.57) * 1.14;
    return s < 0.1 ? 0 : (s - 0.027) * 100;
  }
  const s = (yb ** 0.65 - yt ** 0.62) * 1.14;
  return s > -0.1 ? 0 : (s + 0.027) * 100;
}

// ---------- OKLab / OKLCH (Björn Ottosson) ----------
const fromLin = (c) => 255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

export function srgbToOklch({ r, g, b }) {
  const R = lin(r), G = lin(g), B = lin(b);
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const C = Math.hypot(a, bb);
  let H = (Math.atan2(bb, a) * 180) / Math.PI;
  if (H < 0) H += 360;
  return { L, C, H };
}

function oklchToLinear({ L, C, H }) {
  const a = C * Math.cos((H * Math.PI) / 180), b = C * Math.sin((H * Math.PI) / 180);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return {
    r: 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    g: -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    b: -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  };
}
const inGamut = ({ r, g, b }) => [r, g, b].every((v) => v >= -0.0005 && v <= 1.0005);

// OKLCH -> sRGB. If out of gamut, lower chroma until it fits (keeps hue and lightness).
export function oklchToSrgb({ L, C, H }) {
  let c = C, lin3 = oklchToLinear({ L, C: c, H });
  if (!inGamut(lin3)) {
    let lo = 0, hi = C;
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2;
      if (inGamut(oklchToLinear({ L, C: mid, H }))) lo = mid; else hi = mid;
    }
    c = lo;
    lin3 = oklchToLinear({ L, C: c, H });
  }
  return { r: fromLin(clamp(lin3.r, 0, 1)), g: fromLin(clamp(lin3.g, 0, 1)), b: fromLin(clamp(lin3.b, 0, 1)), a: 1 };
}

// Move a colour's lightness (same hue/chroma) until it reaches `target` WCAG ratio on `bg`.
// First tries to keep it on the same side of the background (lighter stays lighter,
// darker stays darker). With cross=true it may then try the other side. Returns null if impossible.
export function fixContrast(fg, bg, target, { cross = true } = {}) {
  const base = srgbToOklch(over(fg, bg));
  const bgL = srgbToOklch(bg).L;
  const dirs = base.L >= bgL ? [1, -1] : [-1, 1];
  for (const dir of cross ? dirs : dirs.slice(0, 1)) {
    for (let step = 0; step <= 100; step++) {
      const L = clamp(base.L + dir * step * 0.01, 0, 1);
      const rounded = parseColor(toHex(oklchToSrgb({ L, C: base.C, H: base.H })));
      if (wcagRatio(rounded, bg) >= target) return rounded;
    }
  }
  return null;
}
