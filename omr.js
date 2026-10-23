/* ورقة الإجابة المظلّلة: التصميم (بالملّيمتر) + قراءتها من صورة الكاميرا.
   يعتمد على vendor/qrcode.js للطباعة و vendor/jsQR.js للقراءة. */
(function (root) {
  'use strict';
  const L = {
    W: 210, H: 297,
    marker: 8,                                         // مربعات الزوايا السوداء
    markers: [[14, 14], [196, 14], [14, 283], [196, 283]], // TL, TR, BL, BR
    qr: { x: 24, y: 5, s: 26 },
    rows: 20, rowY0: 46, rowH: 11.5,
    colRight: [192, 131, 70],                          // العمود الأول على اليمين
    optGap: 11, optStart: 15, r: 3.4,
    letters: ['أ', 'ب', 'ج', 'د']
  };
  const MAXQ = L.rows * L.colRight.length;

  function bubbleCenter(q, k) {
    const col = Math.floor(q / L.rows), row = q % L.rows;
    return [L.colRight[col] - L.optStart - k * L.optGap, L.rowY0 + row * L.rowH];
  }

  /* ---------------- الطباعة: صفحة SVG لكل طالب ---------------- */
  function qrPath(text) {
    const q = root.qrcode(0, 'M'); q.addData(text, 'Alphanumeric'); q.make();
    const n = q.getModuleCount(); let d = '';
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (q.isDark(y, x)) d += `M${x} ${y}h1v1h-1z`;
    return { d, n };
  }
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function sheetSVG(opts) {
    // opts: { examId, studentId, studentName, title, count, options:[n per question], fill:[answers] (للتجربة فقط) }
    const qr = qrPath(('B1:' + opts.examId + ':' + opts.studentId).toUpperCase());
    const m = L.marker;
    let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${L.W} ${L.H}" width="${L.W}mm" height="${L.H}mm" class="omr-sheet" font-family="'IBM Plex Sans Arabic', Tahoma, Arial, sans-serif">`;
    s += `<rect width="${L.W}" height="${L.H}" fill="#fff"/>`;
    L.markers.forEach(([x, y]) => { s += `<rect x="${x - m / 2}" y="${y - m / 2}" width="${m}" height="${m}" fill="#000"/>`; });
    const sc = L.qr.s / (qr.n + 2);
    s += `<g transform="translate(${L.qr.x + sc} ${L.qr.y + sc}) scale(${sc})"><path d="${qr.d}" fill="#000"/></g>`;
    // رأس الورقة: سطر واحد فيه اسم الطالب وعنوان الامتحان
    s += `<text x="188" y="21" direction="rtl" text-anchor="start" font-size="4.6" fill="#000"><tspan font-weight="700">${esc(opts.studentName)}</tspan><tspan fill="#666">   ·   </tspan><tspan>${esc(opts.title)}</tspan></text>`;
    s += `<line x1="56" y1="33" x2="188" y2="33" stroke="#999" stroke-width=".3"/>`;
    s += `<text x="188" y="38.5" direction="rtl" text-anchor="start" font-size="2.9" fill="#555">ظلّل دائرة واحدة فقط لكل سؤال بقلم أزرق أو أسود. لا تكتب قرب المربعات السوداء أو الرمز.</text>`;
    for (let q = 0; q < opts.count; q++) {
      const nOpt = Math.min(4, (opts.options && opts.options[q]) || 4);
      const [x0, y] = bubbleCenter(q, 0);
      s += `<text x="${x0 + 9}" y="${y + 1.3}" text-anchor="middle" font-size="3.6" font-weight="700" fill="#000">${q + 1}</text>`;
      for (let k = 0; k < nOpt; k++) {
        const [x] = bubbleCenter(q, k);
        // fill: للتجربة فقط (رسم إجابات معروفة)
        const filled = opts.fill && (opts.fill[q] === k || (Array.isArray(opts.fill[q]) && opts.fill[q].indexOf(k) > -1));
        s += `<circle cx="${x}" cy="${y}" r="${L.r}" fill="#fff" stroke="#333" stroke-width=".35"/>`;
        s += `<text x="${x}" y="${y + 1.05}" text-anchor="middle" font-size="2.8" fill="#9a9a9a">${L.letters[k]}</text>`;
        if (filled) s += opts.pen ? `<circle cx="${x + 0.3}" cy="${y - 0.2}" r="${L.r * 0.8}" fill="${opts.pen}" opacity=".82"/>` : `<circle cx="${x}" cy="${y}" r="${L.r}" fill="#1a1a1a"/>`;
      }
    }
    // خط فاصل بين الأعمدة
    for (let c = 1; c < Math.ceil(opts.count / L.rows); c++) {
      const x = L.colRight[c] + 4.5;
      s += `<line x1="${x}" y1="${L.rowY0 - 6}" x2="${x}" y2="${L.rowY0 + (L.rows - 1) * L.rowH + 6}" stroke="#ccc" stroke-width=".3"/>`;
    }
    s += `<text x="105" y="292" text-anchor="middle" font-size="2.6" fill="#888">${esc(opts.examId)} · ${esc(opts.studentId)}</text>`;
    return s + '</svg>';
  }

  /* ---------------- القراءة ---------------- */
  function homography(src, dst) {
    // src, dst: 4 نقاط [x,y]؛ يُرجع مصفوفة 3×3 تحوّل src إلى dst
    const A = [], b = [];
    for (let i = 0; i < 4; i++) {
      const [x, y] = src[i], [u, v] = dst[i];
      A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]); b.push(u);
      A.push([0, 0, 0, x, y, 1, -v * x, -v * y]); b.push(v);
    }
    const n = 8;
    for (let c = 0; c < n; c++) {
      let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
      [A[c], A[p]] = [A[p], A[c]]; [b[c], b[p]] = [b[p], b[c]];
      if (Math.abs(A[c][c]) < 1e-12) return null;
      for (let r = 0; r < n; r++) if (r !== c) {
        const f = A[r][c] / A[c][c];
        for (let k = c; k < n; k++) A[r][k] -= f * A[c][k];
        b[r] -= f * b[c];
      }
    }
    const h = b.map((v, i) => v / A[i][i]);
    return [h[0], h[1], h[2], h[3], h[4], h[5], h[6], h[7], 1];
  }
  // affine بالمربعات الصغرى من 4 نقاط
  function affineFit(src, dst) {
    const N = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], bx = [0, 0, 0], by = [0, 0, 0];
    src.forEach(([x, y], i) => { const v = [x, y, 1]; for (let a = 0; a < 3; a++) { for (let c = 0; c < 3; c++) N[a][c] += v[a] * v[c]; bx[a] += v[a] * dst[i][0]; by[a] += v[a] * dst[i][1]; } });
    const solve = (M, b) => { const A = M.map((r, i) => r.concat([b[i]])); for (let c = 0; c < 3; c++) { let p = c; for (let r = c + 1; r < 3; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r; [A[c], A[p]] = [A[p], A[c]]; for (let r = 0; r < 3; r++) if (r !== c) { const f = A[r][c] / A[c][c]; for (let k = c; k < 4; k++) A[r][k] -= f * A[c][k]; } } return A.map((r, i) => r[3] / r[i]); };
    const X = solve(N, bx), Y = solve(N, by);
    return [X[0], X[1], X[2], Y[0], Y[1], Y[2], 0, 0, 1];
  }
  const apply = (H, x, y) => { const w = H[6] * x + H[7] * y + H[8]; return [(H[0] * x + H[1] * y + H[2]) / w, (H[3] * x + H[4] * y + H[5]) / w]; };

  function toGray(img) {
    const { data, width: w, height: h } = img;
    const g = new Uint8ClampedArray(w * h);
    for (let i = 0, j = 0; i < g.length; i++, j += 4) g[i] = (data[j] * 77 + data[j + 1] * 150 + data[j + 2] * 29) >> 8;
    return g;
  }

  // عناصر داكنة مربعة ممتلئة (مرشحة لمربعات الزوايا)
  function findSquares(g, w, h) {
    const ii = new Float64Array((w + 1) * (h + 1));
    for (let y = 0; y < h; y++) { let row = 0; for (let x = 0; x < w; x++) { row += g[y * w + x]; ii[(y + 1) * (w + 1) + x + 1] = ii[y * (w + 1) + x + 1] + row; } }
    const s = Math.max(15, Math.round(w / 10)), half = s >> 1;
    const bin = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) {
      const y0 = Math.max(0, y - half), y1 = Math.min(h, y + half + 1);
      for (let x = 0; x < w; x++) {
        const x0 = Math.max(0, x - half), x1 = Math.min(w, x + half + 1);
        const sum = ii[y1 * (w + 1) + x1] - ii[y0 * (w + 1) + x1] - ii[y1 * (w + 1) + x0] + ii[y0 * (w + 1) + x0];
        const mean = sum / ((x1 - x0) * (y1 - y0));
        bin[y * w + x] = g[y * w + x] < mean * 0.72 && g[y * w + x] < 150 ? 1 : 0;
      }
    }
    const lab = new Int32Array(w * h).fill(-1);
    const out = [];
    const stack = new Int32Array(w * h);
    for (let i = 0; i < w * h; i++) {
      if (!bin[i] || lab[i] !== -1) continue;
      let sp = 0; stack[sp++] = i; lab[i] = out.length;
      let area = 0, minx = w, maxx = 0, miny = h, maxy = 0, sx = 0, sy = 0;
      const ext = [[0, 0, Infinity], [0, 0, -Infinity], [0, 0, Infinity], [0, 0, -Infinity]]; // أطراف x+y و x-y
      while (sp) {
        const p = stack[--sp], px = p % w, py = (p / w) | 0;
        area++; sx += px; sy += py;
        if (px < minx) minx = px; if (px > maxx) maxx = px; if (py < miny) miny = py; if (py > maxy) maxy = py;
        const a1 = px + py, a2 = px - py;
        if (a1 < ext[0][2]) ext[0] = [px, py, a1]; if (a1 > ext[1][2]) ext[1] = [px, py, a1];
        if (a2 < ext[2][2]) ext[2] = [px, py, a2]; if (a2 > ext[3][2]) ext[3] = [px, py, a2];
        if (px > 0 && bin[p - 1] && lab[p - 1] === -1) { lab[p - 1] = out.length; stack[sp++] = p - 1; }
        if (px < w - 1 && bin[p + 1] && lab[p + 1] === -1) { lab[p + 1] = out.length; stack[sp++] = p + 1; }
        if (py > 0 && bin[p - w] && lab[p - w] === -1) { lab[p - w] = out.length; stack[sp++] = p - w; }
        if (py < h - 1 && bin[p + w] && lab[p + w] === -1) { lab[p + w] = out.length; stack[sp++] = p + w; }
      }
      const bw = maxx - minx + 1, bh = maxy - miny + 1, cx = sx / area, cy = sy / area;
      // المربع: المساحة ÷ (أبعد نقطة عن المركز)² ≈ 2، والدائرة ≈ 3.14 — لا يتأثر بالدوران
      let r2 = 0; ext.forEach(e => { const d = (e[0] - cx) ** 2 + (e[1] - cy) ** 2; if (d > r2) r2 = d; });
      [[minx, cy], [maxx, cy], [cx, miny], [cx, maxy]].forEach(e => { const d = (e[0] - cx) ** 2 + (e[1] - cy) ** 2; if (d > r2) r2 = d; });
      out.push({ area, bw, bh, cx, cy, fill: area / (bw * bh), sq: area / Math.max(1, r2) });
    }
    const minS = w * 0.012, maxS = w * 0.09;
    if (root.OMR_DEBUG) root.OMR_DEBUG.comps = out.filter(c => c.area > 200).map(c => [Math.round(c.cx), Math.round(c.cy), c.bw, c.bh, +c.fill.toFixed(2), c.area, +c.sq.toFixed(2)]);
    return out.filter(c => c.bw >= minS && c.bh >= minS && c.bw <= maxS && c.bh <= maxS && c.bw / c.bh > 0.5 && c.bw / c.bh < 2 && c.fill > 0.6 && c.sq > 1.45 && c.sq < 2.6);
  }

  function sampleMean(g, w, h, cx, cy, r) {
    let sum = 0, n = 0;
    const step = Math.max(1, r / 4);
    for (let dy = -r; dy <= r; dy += step) for (let dx = -r; dx <= r; dx += step) {
      if (dx * dx + dy * dy > r * r) continue;
      const x = Math.round(cx + dx), y = Math.round(cy + dy);
      if (x < 0 || y < 0 || x >= w || y >= h) continue;
      sum += g[y * w + x]; n++;
    }
    return n ? sum / n : 255;
  }

  /**
   * يقرأ ورقة الإجابة من صورة (ImageData).
   * opts: { count, options:[...] }  — عدد الأسئلة وعدد الاختيارات لكل سؤال
   */
  function decode(img, opts, qrImg) {
    const w = img.width, h = img.height;
    // رمز QR يُقرأ من صورة أدق إن توفرت، ثم تُحوَّل إحداثياته للصورة الأساسية
    let code = null;
    if (qrImg) {
      code = root.jsQR(qrImg.data, qrImg.width, qrImg.height, { inversionAttempts: 'dontInvert' });
      if (code) { const k = w / qrImg.width; ['topLeftCorner', 'topRightCorner', 'bottomLeftCorner', 'bottomRightCorner'].forEach(n => { code.location[n] = { x: code.location[n].x * k, y: code.location[n].y * k }; }); }
    }
    if (!code) code = root.jsQR(img.data, w, h, { inversionAttempts: 'dontInvert' });
    if (!code || !/^B1[:|]/.test(code.data)) return { status: 'noqr' };
    const parts = code.data.split(/[:|]/);
    const g = toGray(img);
    // تقدير أولي لموضع الورقة من زوايا رمز QR
    const q = L.qr;
    const loc = code.location;
    // jsQR يعطي زوايا منطقة الرموز بدون الهامش: هامشنا وحدة واحدة من n+2
    const qrMm = (() => { const inner = q.s * (1 - 2 / (qrModules(code) + 2)); const off = (q.s - inner) / 2; return [[q.x + off, q.y + off], [q.x + off + inner, q.y + off], [q.x + off, q.y + off + inner], [q.x + off + inner, q.y + off + inner]]; })();
    // تقدير تقريبي (affine) من زوايا الرمز: ثابت عند الامتداد لأطراف الورقة، بخلاف المنظوري
    const H0 = affineFit(qrMm, [[loc.topLeftCorner.x, loc.topLeftCorner.y], [loc.topRightCorner.x, loc.topRightCorner.y], [loc.bottomLeftCorner.x, loc.bottomLeftCorner.y], [loc.bottomRightCorner.x, loc.bottomRightCorner.y]]);
    if (!H0) return { status: 'nopage', qr: code.data };
    const cands = findSquares(g, w, h);
    const ppm = Math.hypot(...[0, 1].map(i => apply(H0, q.x + q.s, q.y)[i] - apply(H0, q.x, q.y)[i])) / q.s;
    const found = [], used = new Set();
    let sized = cands.filter(c => Math.abs(Math.sqrt(c.area) / (L.marker * ppm) - 1) < 0.45);
    // مربعات الزوايا هي الأكبر؛ نستبعد ما هو أصغر بوضوح (دوائر مظلّلة تبدو مربعة في الصور الصغيرة)
    if (sized.length > 4) { const a4 = sized.map(c => c.area).sort((a, b) => b - a)[3]; sized = sized.filter(c => c.area >= a4 * 0.62); }
    for (const [mx, my] of L.markers) {
      const [px, py] = apply(H0, mx, my);
      let best = -1, bd = Infinity;
      sized.forEach((c, i) => { if (used.has(i)) return; const d = Math.hypot(c.cx - px, c.cy - py); if (d < bd) { bd = d; best = i; } });
      if (best < 0 || bd > 90 * ppm) return { status: 'nomarkers', qr: code.data, found };
      used.add(best); found.push([sized[best].cx, sized[best].cy]);
    }
    const H = homography(L.markers, found);
    if (!H) return { status: 'nomarkers', qr: code.data };
    // تحقق: رمز QR يجب أن يقع في مكانه المتوقع
    const [qcx, qcy] = apply(H, q.x + q.s / 2, q.y + q.s / 2);
    const qrc = [(loc.topLeftCorner.x + loc.bottomRightCorner.x) / 2, (loc.topLeftCorner.y + loc.bottomRightCorner.y) / 2];
    if (Math.hypot(qcx - qrc[0], qcy - qrc[1]) > 6 * ppm) return { status: 'nomarkers', qr: code.data };
    const scale = Math.hypot(...[0, 1].map(i => apply(H, 106, 150)[i] - apply(H, 105, 150)[i]));
    const r = Math.max(1.5, L.r * 0.55 * scale);
    // مستوى البياض: نقاط بين الدوائر
    const whites = [];
    for (let row = 0; row < L.rows; row += 2) for (let c = 0; c < 3; c++) {
      const [x, y] = apply(H, L.colRight[c] - L.optStart - 1.5 * L.optGap, L.rowY0 + row * L.rowH + L.rowH / 2);
      whites.push(sampleMean(g, w, h, x, y, r));
    }
    whites.sort((a, b) => a - b);
    const white = Math.max(60, whites[Math.floor(whites.length * 0.75)]);
    const answers = [], dark = [];
    for (let i = 0; i < opts.count; i++) {
      const nOpt = Math.min(4, (opts.options && opts.options[i]) || 4);
      const d = [];
      for (let k = 0; k < nOpt; k++) {
        const [mx, my] = bubbleCenter(i, k);
        const [x, y] = apply(H, mx, my);
        d.push(Math.max(0, 1 - sampleMean(g, w, h, x, y, r) / white));
      }
      const order = d.map((v, k) => [v, k]).sort((a, b) => b[0] - a[0]);
      const [top, second] = [order[0], order[1] || [0, -1]];
      let a = -1;
      if (top[0] >= 0.38) a = (second[0] >= 0.38 && top[0] - second[0] < 0.18) ? -2 : top[1];
      answers.push(a); dark.push(d.map(v => Math.round(v * 100) / 100));
    }
    return { status: 'ok', qr: code.data, examId: parts[1], studentId: parts[2], answers, dark, corners: found };
  }
  function qrModules(code) {
    // عدد وحدات رمز QR من الإصدار
    const v = code.version || 1; return 17 + 4 * v;
  }

  root.OMR = { layout: L, MAXQ, sheetSVG, decode, bubbleCenter, homography, apply, _findSquares: findSquares, _toGray: toGray };
})(typeof self !== 'undefined' ? self : this);
