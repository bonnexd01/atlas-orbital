/* Atlas Orbital · laboratórios 2D (canvas). Cada quadro é função do tempo t.
   LABS[tipo] = { controles(sat) → [{id, rotulo, ops:[[valor, texto]]}], init(estado, sat), draw(g, w, h, t, estado, sat), hover? } */
(function () {
  const C = {
    bg: '#0a1020', grid: 'rgba(150,175,215,.12)', axis: 'rgba(190,205,230,.55)', ink: '#e7edf6', mute: '#8b9ab3',
    laser: '#ff6a3d', green: '#5dff9a', gold: '#ffc94a', radar: '#c49bff',
    leaf: '#3f8f4f', leafHi: '#7bd389', trunk: '#6b4a2f', ground: '#5a4430', grass: '#9a9a4a'
  };
  const MONO = '600 11px "IBM Plex Mono", ui-monospace, Consolas, monospace';
  const MONO_S = '500 10px "IBM Plex Mono", ui-monospace, Consolas, monospace';
  const SANS = '600 12px "IBM Plex Sans", system-ui, sans-serif';
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = x => { x = clamp(x); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const fmt = (v, d = 1) => v.toFixed(d).replace('.', ',');
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function gauss(r) { let u = 0, v = 0; while (!u) u = r(); while (!v) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
  function poisson(r, l) { const L = Math.exp(-l); let k = 0, p = 1; do { k++; p *= r(); } while (p > L); return k - 1; }
  function vnoise(seed) {
    const h = (x, y) => { let n = x * 374761393 + y * 668265263 + seed * 1442695041; n = (n ^ (n >>> 13)) * 1274126177; return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
    const s = t => t * t * (3 - 2 * t);
    return (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), xf = s(x - xi), yf = s(y - yi);
      return lerp(lerp(h(xi, yi), h(xi + 1, yi), xf), lerp(h(xi, yi + 1), h(xi + 1, yi + 1), xf), yf); };
  }
  function label(g, txt, x, y, col = C.ink, font = MONO, align = 'left') { g.font = font; g.fillStyle = col; g.textAlign = align; g.fillText(txt, x, y); }
  function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  function satIcon(g, x, y, s, col) {
    g.save(); g.translate(x, y);
    g.fillStyle = '#c7962f'; g.fillRect(-s * .35, -s * .3, s * .7, s * .6);
    g.fillStyle = '#1d2d5c'; g.fillRect(-s * 1.3, -s * .18, s * .85, s * .36); g.fillRect(s * .45, -s * .18, s * .85, s * .36);
    g.fillStyle = col; g.beginPath(); g.arc(0, s * .38, s * .14, 0, 7); g.fill();
    g.restore();
  }

  const LABS = {};

  /* ============ LIDAR DE FORMA DE ONDA (GEDI) ============ */
  const VEG = {
    floresta: { nome: 'Floresta tropical', seed: 11 },
    cerradao: { nome: 'Cerradão', seed: 23 },
    cerrado: { nome: 'Cerrado típico', seed: 37 },
    campo: { nome: 'Campo', seed: 41 }
  };
  function makeStand(tipo) {
    const r = rng(VEG[tipo].seed), crowns = [];
    let grass = 0, grassCover = 0;
    const add = (n, h0, h1, rw0, rw1, depth) => {
      for (let i = 0; i < n; i++) {
        const h = lerp(h0, h1, r()), rx = lerp(rw0, rw1, r()), rz = h * depth / 2;
        crowns.push({ x: lerp(-33, 33, r()), h, rx, rz, zc: h - rz });
      }
    };
    if (tipo === 'floresta') { add(9, 24, 38, 4, 7, .38); add(10, 12, 22, 2.5, 4.5, .4); add(8, 4, 10, 1.5, 2.6, .5); }
    if (tipo === 'cerradao') { add(14, 7, 14, 2, 3.6, .5); add(6, 3, 6, 1.2, 2, .5); grass = .4; grassCover = .3; }
    if (tipo === 'cerrado') { add(6, 2.5, 6.5, 1, 2.4, .55); add(5, 1, 2.2, .6, 1.1, .6); grass = .6; grassCover = .7; }
    if (tipo === 'campo') { add(1, 1.2, 1.6, .7, 1, .7); grass = .7; grassCover = .95; }
    crowns.sort((a, b) => a.h - b.h);
    const top = Math.max(grass, ...crowns.map(c => c.h));
    const zmax = Math.max(10, Math.ceil(top * 1.25 / 5) * 5);
    // perfil vertical dentro da pegada (±12,5 m)
    const dz = .1, zmin = -4, nb = Math.round((zmax - zmin) / dz);
    const cover = new Float32Array(nb);
    for (let i = 0; i < nb; i++) {
      const z = zmin + (i + .5) * dz; let c = 0;
      for (const k of crowns) {
        const u = (z - k.zc) / k.rz; if (Math.abs(u) >= 1) continue;
        const hw = k.rx * Math.sqrt(1 - u * u);
        const ov = Math.max(0, Math.min(k.x + hw, 12.5) - Math.max(k.x - hw, -12.5));
        c += ov / 25 * .75;
      }
      if (z > 0 && z < grass) c += grassCover * 1.6;
      cover[i] = c;
    }
    const ret = new Float32Array(nb); let Tr = 1, T1 = null; const k = .9, rv = .45, rg = .32;
    for (let i = nb - 1; i >= 0; i--) {
      const z = zmin + (i + .5) * dz;
      if (z < 1 && T1 === null) T1 = Tr;
      if (z < 0) break;
      const inter = Tr * (1 - Math.exp(-k * cover[i] * dz));
      ret[i] += inter * rv; Tr -= inter;
    }
    const gi = Math.round((0 - zmin) / dz);
    ret[gi] += Tr * rg;
    const sig = 1.0 / dz, wf = new Float32Array(nb);
    for (let i = 0; i < nb; i++) { if (!ret[i]) continue; for (let j = Math.max(0, i - 4 * sig | 0); j < Math.min(nb, i + 4 * sig); j++) { const d = (j - i) / sig; wf[j] += ret[i] * Math.exp(-.5 * d * d); } }
    let mx = 0, tot = 0; for (let i = 0; i < nb; i++) { mx = Math.max(mx, wf[i]); tot += wf[i]; }
    const cum = []; let acc = 0; for (let i = 0; i < nb; i++) { acc += wf[i]; cum.push(acc / tot); }
    const rh = p => { for (let i = 0; i < nb; i++) if (cum[i] >= p) return zmin + (i + .5) * dz; return zmax; };
    return { crowns, grass, grassCover, zmax, zmin, dz, nb, wf, mx, rh: { 25: rh(.25), 50: rh(.5), 75: rh(.75), 98: rh(.98) }, coberturaDossel: 1 - (T1 === null ? Tr : T1), top };
  }
  LABS.lidar = {
    controles: () => [{ id: 'veg', rotulo: 'Vegetação', ops: Object.keys(VEG).map(k => [k, VEG[k].nome]) }],
    padrao: () => ({ veg: 'floresta' }),
    init: (s) => { s.stand = makeStand(s.veg); },
    draw(g, w, h, t, s) {
      const st = s.stand, P = 5.2, tt = t % P;
      const sceneW = w * .6, plotX = sceneW + 26, plotW = w - plotX - 18;
      const top = 54, bot = h - 46, groundY = lerp(top, bot, (st.zmax - 0) / (st.zmax - st.zmin));
      const pxm = (bot - top) / (st.zmax - st.zmin);
      const Y = z => groundY - z * pxm;
      const scale = Math.min(sceneW / 72, pxm * 1.0);
      const X = x => sceneW / 2 + x * (sceneW / 72);
      // fundo
      g.fillStyle = C.bg; g.fillRect(0, 0, w, h);
      g.strokeStyle = C.grid; g.lineWidth = 1;
      const step = st.zmax > 20 ? 10 : 2;
      for (let z = 0; z <= st.zmax; z += step) { g.beginPath(); g.moveTo(0, Y(z)); g.lineTo(w, Y(z)); g.stroke(); label(g, z + ' m', 6, Y(z) - 3, C.mute, MONO_S); }
      // pulso: descida 0–1,3 s; retorno 1,3–3,4 s
      const zTop = st.zmax, zf = tt < 1.3 ? lerp(zTop + 6, st.zmin, ease(tt / 1.3)) : st.zmin;
      // solo
      g.fillStyle = C.ground; g.fillRect(0, Y(0), sceneW, h - Y(0));
      g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(0, Y(0) + 6, sceneW, h);
      // capim
      if (st.grass > 0) { g.fillStyle = C.grass; const r = rng(5); for (let x = -36; x < 36; x += .25) { const hh = st.grass * (.5 + r() * .7); g.fillRect(X(x), Y(hh), 1.4, hh * pxm); } }
      // pegada
      g.fillStyle = 'rgba(255,106,61,.07)'; g.fillRect(X(-12.5), top - 10, X(12.5) - X(-12.5), Y(0) - top + 10);
      g.setLineDash([4, 4]); g.strokeStyle = 'rgba(255,106,61,.55)';
      [-12.5, 12.5].forEach(x => { g.beginPath(); g.moveTo(X(x), top - 10); g.lineTo(X(x), Y(0) + 4); g.stroke(); });
      g.setLineDash([]);
      label(g, 'pegada ≈ 25 m', X(0), Y(0) + 22, C.laser, MONO, 'center');
      // árvores
      for (const k of st.crowns) {
        const inFoot = Math.abs(k.x) < 12.5 + k.rx;
        g.strokeStyle = C.trunk; g.lineWidth = Math.max(1.5, k.h * .12 * (sceneW / 72) / 3);
        g.beginPath(); g.moveTo(X(k.x), Y(0)); g.lineTo(X(k.x), Y(k.zc)); g.stroke();
        const lit = inFoot && tt < 3.4 && zf < k.h + 1 && zf > k.zc - k.rz - 2 && tt < 1.3;
        g.fillStyle = lit ? C.leafHi : C.leaf; g.globalAlpha = inFoot ? .95 : .55;
        g.beginPath(); g.ellipse(X(k.x), Y(k.zc), k.rx * (sceneW / 72), k.rz * pxm, 0, 0, 7); g.fill();
        g.globalAlpha = 1;
      }
      // satélite e feixe
      satIcon(g, X(0), 22, 14, C.laser);
      label(g, '↑ 420 km', X(0) + 26, 26, C.mute, MONO_S);
      if (tt < 1.3) {
        const gy = Y(zf), gr = g.createLinearGradient(0, gy - 22, 0, gy + 4);
        gr.addColorStop(0, 'rgba(255,106,61,0)'); gr.addColorStop(1, 'rgba(255,140,90,.85)');
        g.fillStyle = gr; g.fillRect(X(-12.5), gy - 22, X(12.5) - X(-12.5), 26);
      } else if (tt < 3.4) {
        const u = (tt - 1.3) / 2.1, r = rng(9);
        g.fillStyle = 'rgba(255,150,110,.9)';
        for (let i = 0; i < 70; i++) {
          const x = lerp(-12, 12, r()), z0 = r() < .3 ? 0 : lerp(0, st.top, r());
          const y = lerp(Y(z0), 30, u + r() * .15);
          g.fillRect(X(x), y, 2, 2);
        }
      }
      // gráfico da forma de onda (mesmo eixo vertical)
      g.strokeStyle = C.axis; g.lineWidth = 1;
      g.beginPath(); g.moveTo(plotX, top - 10); g.lineTo(plotX, bot); g.lineTo(plotX + plotW, bot); g.stroke();
      label(g, 'energia do eco →', plotX + plotW, bot + 16, C.mute, MONO_S, 'right');
      label(g, 'FORMA DE ONDA', plotX, top - 22, C.ink, MONO);
      let zShow = st.zmax + 10;
      if (tt >= 1.3) zShow = lerp(st.zmax + 2, st.zmin, ease((tt - 1.3) / 2.1));
      if (tt < 1.3) zShow = st.zmax + 10;
      // curva anterior em fantasma, para a turma não perder a referência entre pulsos
      if (tt < 3.4) {
        g.beginPath();
        for (let i = st.nb - 1; i >= 0; i--) { const z = st.zmin + (i + .5) * st.dz, x = plotX + st.wf[i] / st.mx * plotW * .92; i === st.nb - 1 ? g.moveTo(plotX, Y(z)) : g.lineTo(x, Y(z)); }
        g.strokeStyle = 'rgba(255,106,61,.22)'; g.lineWidth = 1.5; g.stroke();
      }
      g.beginPath(); let first = true;
      for (let i = st.nb - 1; i >= 0; i--) {
        const z = st.zmin + (i + .5) * st.dz; if (z < zShow) break;
        const x = plotX + st.wf[i] / st.mx * plotW * .92, y = Y(z);
        if (first) { g.moveTo(plotX, y); first = false; } g.lineTo(x, y);
      }
      g.strokeStyle = C.laser; g.lineWidth = 2; g.stroke();
      // RH
      if (tt > 3.4) {
        const a = clamp((tt - 3.4) / .5);
        g.globalAlpha = a;
        [[98, '#ffd0c0'], [75, '#ffb59c'], [50, '#ff9a78'], [25, '#ff7e55']].forEach(([p, col], i) => {
          const z = st.rh[p], y = Y(z);
          g.setLineDash([3, 3]); g.strokeStyle = col; g.beginPath(); g.moveTo(plotX, y); g.lineTo(plotX + plotW, y); g.stroke(); g.setLineDash([]);
          label(g, `RH${p} ${fmt(Math.max(0, z))} m`, plotX + plotW, y - 3, col, MONO_S, 'right');
        });
        label(g, 'chão', plotX + 6, Y(0) + 12, C.mute, MONO_S);
        g.globalAlpha = 1;
      }
      // rodapé
      label(g, `t = 2h / c  ·  1 m de altura ≈ 6,7 ns`, 12, h - 14, C.mute, MONO);
      label(g, `${VEG[s.veg].nome}: RH98 ${fmt(Math.max(0, st.rh[98]))} m · cobertura acima de 1 m ≈ ${Math.round(st.coberturaDossel * 100)} %`, w - 12, h - 14, C.ink, MONO, 'right');
    }
  };

  /* ============ CONTAGEM DE FÓTONS (ICESat-2) ============ */
  LABS.fotons = {
    controles: () => [
      { id: 'luz', rotulo: 'Iluminação', ops: [['noite', 'Noite'], ['dia', 'Dia']] },
      { id: 'feixe', rotulo: 'Feixe', ops: [['forte', 'Forte'], ['fraco', 'Fraco']] },
      { id: 'classe', rotulo: 'Fótons', ops: [['bruto', 'Brutos (ATL03)'], ['atl08', 'Classificados (ATL08)']] }
    ],
    padrao: () => ({ luz: 'noite', feixe: 'forte', classe: 'bruto' }),
    init(s) {
      const r = rng(77), n = vnoise(3), L = 420;
      const segs = [[0, 130, 26, .9, 'floresta'], [130, 230, 10, .7, 'cerradão'], [230, 330, 4.5, .35, 'cerrado'], [330, 420, .6, .05, 'campo']];
      const ground = x => 6 * Math.sin(x / 70) + 3 * n(x / 25, 1) + x * .012;
      const canopy = x => { const sgm = segs.find(q => x >= q[0] && x < q[1]) || segs[3]; return { h: sgm[2] * (.75 + .5 * n(x / 9, 4)), c: sgm[3] }; };
      const lamS = s.feixe === 'forte' ? 3.2 : .8, lamN = s.luz === 'dia' ? 3.0 : .06;
      const ph = [];
      for (let x = 0; x < L; x += .7) {
        const zg = ground(x), cp = canopy(x);
        const k = poisson(r, lamS);
        for (let i = 0; i < k; i++) {
          if (r() < cp.c * .72 && cp.h > .8) { const z = zg + cp.h * (1 - Math.pow(r(), 2.2) * .85); ph.push([x, z, 1]); }
          else ph.push([x, zg + gauss(r) * .35, 0]);
        }
        const kn = poisson(r, lamN);
        for (let i = 0; i < kn; i++) ph.push([x, zg - 12 + r() * 60, 2]);
      }
      // ATL08 simplificado: segmentos de 20 m
      const seg20 = [];
      for (let x0 = 0; x0 < L; x0 += 20) {
        const inS = ph.filter(p => p[0] >= x0 && p[0] < x0 + 20);
        const gz = inS.filter(p => p[2] === 0).map(p => p[1]).sort((a, b) => a - b);
        const cz = inS.filter(p => p[2] === 1).map(p => p[1]).sort((a, b) => a - b);
        const gm = gz.length ? gz[gz.length >> 1] : ground(x0 + 10);
        const top = cz.length > 2 ? cz[Math.floor(cz.length * .98)] : gm;
        seg20.push({ x0, gm, top, hc: Math.max(0, top - gm), n: gz.length });
      }
      Object.assign(s, { ph, segs, L, seg20, ground });
    },
    draw(g, w, h, t, s) {
      const top = 46, bot = h - 52, zmin = -14, zmax = 48;
      const X = x => 14 + x / s.L * (w - 28), Y = z => lerp(bot, top, (z - zmin) / (zmax - zmin));
      g.fillStyle = s.luz === 'dia' ? '#121c33' : C.bg; g.fillRect(0, 0, w, h);
      g.strokeStyle = C.grid;
      for (let z = -10; z <= 40; z += 10) { g.beginPath(); g.moveTo(0, Y(z)); g.lineTo(w, Y(z)); g.stroke(); label(g, z + ' m', 4, Y(z) - 3, C.mute, MONO_S); }
      s.segs.forEach(q => { label(g, q[4], X((q[0] + q[1]) / 2), bot + 18, C.mute, MONO_S, 'center'); g.strokeStyle = 'rgba(150,175,215,.25)'; g.beginPath(); g.moveTo(X(q[0]), top); g.lineTo(X(q[0]), bot); g.stroke(); });
      const P = 9, prog = clamp((t % (P + 3)) / P), xr = prog * s.L;
      const cls = s.classe === 'atl08' && prog >= 1;
      for (const p of s.ph) {
        if (p[0] > xr) continue;
        if (cls) g.fillStyle = p[2] === 0 ? '#ffb347' : p[2] === 1 ? '#5dff9a' : 'rgba(160,170,190,.35)';
        else g.fillStyle = 'rgba(93,255,154,.75)';
        g.fillRect(X(p[0]), Y(p[1]), 1.6, 1.6);
      }
      if (cls) {
        g.lineWidth = 2;
        g.strokeStyle = '#ffb347'; g.beginPath(); s.seg20.forEach((q, i) => { const x = X(q.x0 + 10); i ? g.lineTo(x, Y(q.gm)) : g.moveTo(x, Y(q.gm)); }); g.stroke();
        g.strokeStyle = '#d9ffe6'; g.beginPath(); s.seg20.forEach((q, i) => { const x = X(q.x0 + 10); i ? g.lineTo(x, Y(q.top)) : g.moveTo(x, Y(q.top)); }); g.stroke();
        const lg = [['#ffb347', 'solo'], ['#5dff9a', 'dossel'], ['#d9ffe6', 'topo do dossel (98%)'], ['rgba(160,170,190,.8)', 'ruído']];
        lg.forEach(([c, tx], i) => { g.fillStyle = c; g.fillRect(14 + i * 150, h - 22, 10, 10); label(g, tx, 30 + i * 150, h - 13, C.ink, MONO_S); });
      } else {
        label(g, `${s.ph.filter(p => p[0] <= xr).length.toLocaleString('pt-BR')} fótons registrados · 1 pulso a cada 0,7 m`, 14, h - 13, C.mute, MONO);
      }
      satIcon(g, X(xr), 20, 12, C.green);
      if (prog < 1) { g.strokeStyle = 'rgba(93,255,154,.5)'; g.setLineDash([2, 4]); g.beginPath(); g.moveTo(X(xr), 30); g.lineTo(X(xr), Y(s.ground(xr))); g.stroke(); g.setLineDash([]); }
      label(g, s.luz === 'dia' ? 'DIA · luz solar gera fótons falsos' : 'NOITE · quase sem ruído', w - 14, 24, s.luz === 'dia' ? C.gold : C.mute, MONO, 'right');
    }
  };

  /* ============ ÓPTICO MULTIESPECTRAL ============ */
  const SPEC = {
    verde: [[400, .04], [500, .05], [550, .11], [600, .07], [670, .04], [700, .1], [740, .36], [780, .46], [900, .5], [1100, .47], [1300, .4], [1450, .19], [1650, .32], [1800, .26], [1950, .09], [2200, .18], [2500, .07]],
    seca: [[400, .06], [500, .08], [550, .11], [600, .13], [670, .15], [700, .18], [750, .25], [900, .3], [1100, .33], [1300, .34], [1450, .25], [1650, .4], [1800, .37], [1950, .22], [2200, .34], [2500, .22]],
    solo: [[400, .08], [500, .11], [550, .14], [600, .18], [670, .21], [800, .26], [1000, .29], [1300, .31], [1450, .27], [1650, .35], [1950, .27], [2200, .33], [2500, .3]],
    agua: [[400, .07], [500, .07], [550, .055], [600, .035], [670, .025], [750, .012], [900, .005], [1100, 0], [2500, 0]]
  };
  const sp = (curve, l) => { for (let i = 1; i < curve.length; i++) if (l <= curve[i][0]) { const [a, ra] = curve[i - 1], [b, rb] = curve[i]; return lerp(ra, rb, (l - a) / (b - a)); } return curve[curve.length - 1][1]; };
  const MIX = {
    agua: { chuva: { agua: 1 }, seca: { agua: 1 }, nome: 'Água' },
    mata: { chuva: { verde: 1 }, seca: { verde: .9, seca: .1 }, nome: 'Mata de galeria' },
    cerrado: { chuva: { verde: .65, solo: .2, seca: .15 }, seca: { seca: .6, solo: .3, verde: .1 }, nome: 'Cerrado típico' },
    campo: { chuva: { verde: .45, seca: .3, solo: .25 }, seca: { seca: .75, solo: .25 }, nome: 'Campo' },
    pivo: { chuva: { verde: .95, solo: .05 }, seca: { verde: .9, solo: .1 }, nome: 'Pivô irrigado' },
    lavoura: { chuva: { verde: .9, solo: .1 }, seca: { solo: .75, seca: .25 }, nome: 'Lavoura / pasto' },
    estrada: { chuva: { solo: 1 }, seca: { solo: 1 }, nome: 'Estrada de terra' }
  };
  const refl = (cls, est, l) => { const m = MIX[cls][est]; let r = 0; for (const k in m) r += m[k] * sp(SPEC[k], l); return r; };
  const BANDS = {
    landsat9: { pix: 30, bands: [['B1', 433, 453], ['B2', 450, 515], ['B3', 525, 600], ['B4', 630, 680], ['B5', 845, 885], ['B9', 1360, 1390], ['B6', 1560, 1660], ['B7', 2100, 2300]], rgb: ['B4', 'B3', 'B2'], nir: 'B5', red: 'B4', green: 'B3' },
    sentinel2: { pix: 10, bands: [['B1', 433, 453], ['B2', 458, 523], ['B3', 543, 578], ['B4', 650, 680], ['B5', 698, 713], ['B6', 733, 748], ['B7', 773, 793], ['B8', 785, 900], ['B8A', 855, 875], ['B9', 935, 955], ['B10', 1360, 1390], ['B11', 1565, 1655], ['B12', 2100, 2280]], rgb: ['B4', 'B3', 'B2'], nir: 'B8', red: 'B4', green: 'B3' },
    amazonia1: { pix: 60, bands: [['B1', 450, 520], ['B2', 520, 590], ['B3', 630, 690], ['B4', 770, 890]], rgb: ['B3', 'B2', 'B1'], nir: 'B4', red: 'B3', green: 'B2' }
  };
  const bandVal = (cls, est, b) => { let s = 0, n = 0; for (let l = b[1]; l <= b[2]; l += 5) { s += refl(cls, est, l); n++; } return s / n; };

  function landscape() {
    if (landscape.cache) return landscape.cache;
    const W = 150, H = 96, n = vnoise(19), n2 = vnoise(7), r = rng(4), cls = new Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const rx = 30 + 18 * Math.sin(y / 14) + 6 * n(y / 6, 2);
      const d = Math.abs(x - rx);
      let c = 'cerrado';
      if (n2(x / 9, y / 9) > .62) c = 'campo';
      if (d < 7 + 3 * n(x / 5, y / 5)) c = 'mata';
      if (d < 1.4) c = 'agua';
      const px = 108, py = 34; if (Math.hypot(x - px, y - py) < 24) c = 'pivo';
      if (x > 64 && x < 92 && y > 58 && y < 92) c = 'lavoura';
      if (Math.abs(y - (x * .35 + 40)) < .8 && x > 55) c = 'estrada';
      cls[y * W + x] = c;
    }
    const jit = Float32Array.from({ length: W * H }, () => .88 + r() * .24);
    return (landscape.cache = { W, H, cls, jit });
  }
  LABS.optico = {
    controles: () => [
      { id: 'est', rotulo: 'Estação', ops: [['chuva', 'Chuvosa'], ['seca', 'Seca']] },
      { id: 'modo', rotulo: 'Composição', ops: [['real', 'Cor verdadeira'], ['falsa', 'Falsa-cor (NIR)'], ['ndvi', 'NDVI']] }
    ],
    padrao: () => ({ est: 'chuva', modo: 'real' }),
    init(s, sat) {
      const L = landscape(), cfg = BANDS[sat], k = Math.max(1, Math.round(cfg.pix / 10));
      const bi = id => cfg.bands.find(b => b[0] === id);
      const vals = {};
      for (const c in MIX) { vals[c] = {}; cfg.bands.forEach(b => vals[c][b[0]] = bandVal(c, s.est, b)); }
      const img = document.createElement('canvas'); img.width = L.W; img.height = L.H;
      const ig = img.getContext('2d'), id = ig.createImageData(L.W, L.H);
      const pix = (x, y) => { // média do bloco do sensor
        const x0 = Math.floor(x / k) * k, y0 = Math.floor(y / k) * k; const acc = {}; let n = 0;
        for (let yy = y0; yy < Math.min(L.H, y0 + k); yy++) for (let xx = x0; xx < Math.min(L.W, x0 + k); xx++) {
          const c = L.cls[yy * L.W + xx], j = L.jit[yy * L.W + xx]; n++;
          for (const b of cfg.bands) acc[b[0]] = (acc[b[0]] || 0) + vals[c][b[0]] * j;
        }
        for (const b in acc) acc[b] /= n; return acc;
      };
      const cache = {};
      for (let y = 0; y < L.H; y++) for (let x = 0; x < L.W; x++) {
        const key = Math.floor(x / k) + ',' + Math.floor(y / k);
        const v = cache[key] || (cache[key] = pix(x, y));
        let R, G, Bc;
        const nd = (v[cfg.nir] - v[cfg.red]) / (v[cfg.nir] + v[cfg.red] + 1e-6);
        if (s.modo === 'real') { R = v[cfg.rgb[0]] * 3.4; G = v[cfg.rgb[1]] * 3.4; Bc = v[cfg.rgb[2]] * 3.6; }
        else if (s.modo === 'falsa') { R = v[cfg.nir] * 1.9; G = v[cfg.red] * 3.2; Bc = v[cfg.green] * 3.4; }
        else { const t = clamp((nd + .1) / .95); R = t < .4 ? lerp(.55, .85, t / .4) : lerp(.85, .1, (t - .4) / .6); G = t < .4 ? lerp(.38, .75, t / .4) : lerp(.75, .5, (t - .4) / .6); Bc = t < .4 ? lerp(.25, .45, t / .4) : lerp(.45, .2, (t - .4) / .6); }
        const o = (y * L.W + x) * 4;
        id.data[o] = 255 * Math.pow(clamp(R), .8); id.data[o + 1] = 255 * Math.pow(clamp(G), .8); id.data[o + 2] = 255 * Math.pow(clamp(Bc), .8); id.data[o + 3] = 255;
      }
      ig.putImageData(id, 0, 0);
      const ndvi = {}; for (const c in MIX) ndvi[c] = (vals[c][cfg.nir] - vals[c][cfg.red]) / (vals[c][cfg.nir] + vals[c][cfg.red] + 1e-6);
      Object.assign(s, { img, cfg, k, vals, ndvi, L, t0: s.t0 || 0 });
      s.restart = true;
    },
    draw(g, w, h, t, s, sat) {
      if (s.restart) { s.tStart = t; s.restart = false; }
      const L = s.L, cfg = s.cfg;
      g.fillStyle = C.bg; g.fillRect(0, 0, w, h);
      // mapa
      const mw = Math.min(w * .5, (h - 70) * L.W / L.H), mh = mw * L.H / L.W, mx = 14, my = 40;
      const prog = clamp((t - s.tStart) / 4.2), rows = prog * L.H;
      g.imageSmoothingEnabled = false;
      g.fillStyle = '#121a2c'; g.fillRect(mx, my, mw, mh);
      g.drawImage(s.img, 0, 0, L.W, Math.max(1, rows), mx, my, mw, mh * rows / L.H);
      if (prog < 1) {
        const ly = my + mh * prog;
        g.strokeStyle = C.gold; g.lineWidth = 2; g.beginPath(); g.moveTo(mx - 6, ly); g.lineTo(mx + mw + 6, ly); g.stroke();
        g.fillStyle = C.gold; for (let i = 0; i <= 40; i++) g.fillRect(mx + i * mw / 40 - .5, ly - 3, 1, 6);
        label(g, 'linha de detectores', mx + mw, ly - 8, C.gold, MONO_S, 'right');
      }
      g.strokeStyle = 'rgba(190,205,230,.4)'; g.lineWidth = 1; g.strokeRect(mx, my, mw, mh);
      label(g, `${SATS[sat].nome} · pixel ${cfg.pix} m · ${{ real: 'cor verdadeira', falsa: 'falsa-cor NIR-R-G', ndvi: 'NDVI' }[s.modo]}`, mx, my - 12, C.ink, MONO);
      label(g, '↓ direção de voo', mx + mw, my + mh + 16, C.mute, MONO_S, 'right');
      // escala
      const m500 = 50 / L.W * mw; g.fillStyle = C.ink; g.fillRect(mx, my + mh + 12, m500, 3); label(g, '500 m', mx + m500 + 6, my + mh + 16, C.mute, MONO_S);
      // hover
      let hc = null;
      if (s.hover && s.hover.x > mx && s.hover.x < mx + mw && s.hover.y > my && s.hover.y < my + mh * prog) {
        const gx = Math.floor((s.hover.x - mx) / mw * L.W), gy = Math.floor((s.hover.y - my) / mh * L.H);
        hc = L.cls[gy * L.W + gx];
        const bx = Math.floor(gx / s.k) * s.k, by = Math.floor(gy / s.k) * s.k;
        g.strokeStyle = '#fff'; g.strokeRect(mx + bx / L.W * mw, my + by / L.H * mh, s.k / L.W * mw, s.k / L.H * mh);
      }
      // espectro
      const cx = mx + mw + 44, cw = w - cx - 16, cy = 40, ch = h - 150;
      const XL = l => cx + (l - 400) / 2100 * cw, YR = r => cy + ch - r / .6 * ch;
      g.fillStyle = 'rgba(255,255,255,.04)';
      [[1340, 1460], [1790, 1960]].forEach(([a, b]) => g.fillRect(XL(a), cy, XL(b) - XL(a), ch));
      g.strokeStyle = C.axis; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx, cy + ch); g.lineTo(cx + cw, cy + ch); g.stroke();
      [500, 1000, 1500, 2000, 2500].forEach(l => label(g, l, XL(l), cy + ch + 13, C.mute, MONO_S, 'center'));
      label(g, 'comprimento de onda (nm)', cx + cw, cy + ch + 26, C.mute, MONO_S, 'right');
      [0, .2, .4, .6].forEach(r => label(g, fmt(r), cx - 6, YR(r) + 3, C.mute, MONO_S, 'right'));
      label(g, 'REFLECTÂNCIA', cx, cy - 12, C.ink, MONO);
      // visível em arco-íris
      const vg = g.createLinearGradient(XL(400), 0, XL(700), 0);
      ['#6a3cff', '#2f7bff', '#25c26b', '#e6d62c', '#ff8a2a', '#e03030'].forEach((c, i) => vg.addColorStop(i / 5, c));
      g.fillStyle = vg; g.fillRect(XL(400), cy + ch + 1, XL(700) - XL(400), 3);
      // bandas
      cfg.bands.forEach((b, i) => {
        const isRE = sat === 'sentinel2' && ['B5', 'B6', 'B7'].includes(b[0]);
        g.fillStyle = isRE ? 'rgba(255,120,90,.22)' : 'rgba(255,201,74,.16)';
        g.fillRect(XL(b[1]), cy, Math.max(2, XL(b[2]) - XL(b[1])), ch);
        label(g, b[0], (XL(b[1]) + XL(b[2])) / 2, cy + 10 + (i % 3) * 10, isRE ? '#ff9a7a' : C.gold, MONO_S, 'center');
      });
      // curvas
      const curves = [['mata', '#59c26a'], ['cerrado', '#c8b04a'], ['lavoura', '#b58a5c'], ['agua', '#4aa3ff']];
      curves.forEach(([c, col]) => {
        g.strokeStyle = col; g.lineWidth = hc === c ? 3.2 : 1.6; g.globalAlpha = hc && hc !== c ? .35 : 1;
        g.beginPath(); for (let l = 400; l <= 2500; l += 10) { const x = XL(l), y = YR(refl(c, s.est, l)); l === 400 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke();
        g.globalAlpha = 1;
      });
      if (hc && !curves.find(q => q[0] === hc)) { g.strokeStyle = '#fff'; g.lineWidth = 2.6; g.beginPath(); for (let l = 400; l <= 2500; l += 10) { const x = XL(l), y = YR(refl(hc, s.est, l)); l === 400 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke(); }
      // legenda + NDVI
      const ly0 = h - 74;
      curves.forEach(([c, col], i) => {
        const x = cx + (i % 2) * (cw / 2), y = ly0 + Math.floor(i / 2) * 30;
        g.fillStyle = col; g.fillRect(x, y - 3, 10, 3); label(g, MIX[c].nome, x + 14, y, C.ink, MONO_S); label(g, 'NDVI ' + fmt(s.ndvi[c], 2), x + 14, y + 13, C.mute, MONO_S);
      });
      if (hc) {
        const v = s.vals[hc];
        const txt = `${MIX[hc].nome} · NDVI ${fmt(s.ndvi[hc], 2)} · ` + [cfg.green, cfg.red, cfg.nir].map(b => `${b} ${fmt(v[b], 2)}`).join(' · ');
        label(g, txt, mx, h - 12, '#fff', MONO);
      } else label(g, 'Passe o mouse sobre a imagem para ler um pixel.', mx, h - 12, C.mute, MONO);
    },
    hover: true
  };

  /* ============ RADAR ============ */
  const BANDA = {
    X: { lam: 3.1, nome: 'X', ex: 'TerraSAR-X', pen: .12, mec: [.82, .05, .13], sat: 30 },
    C: { lam: 5.5, nome: 'C', ex: 'Sentinel-1', pen: .22, mec: [.72, .1, .18], sat: 50 },
    S: { lam: 10, nome: 'S', ex: 'NISAR (ISRO)', pen: .38, mec: [.6, .22, .18], sat: 70 },
    L: { lam: 24, nome: 'L', ex: 'NISAR (NASA)', pen: .66, mec: [.45, .4, .15], sat: 110 },
    P: { lam: 69, nome: 'P', ex: 'BIOMASS', pen: 1.05, mec: [.25, .62, .13], sat: 220 }
  };
  LABS.radar = {
    controles: () => [{ id: 'banda', rotulo: 'Banda', ops: Object.keys(BANDA).map(k => [k, `${k} · ${fmt(BANDA[k].lam, BANDA[k].lam < 10 ? 1 : 0)} cm`]) }],
    padrao: (sat) => ({ banda: SATS[sat].banda || 'C' }),
    init(s) { const r = rng(15); s.trees = Array.from({ length: 11 }, (_, i) => ({ x: i / 10, h: lerp(.75, 1, r()), w: lerp(.05, .08, r()) })); },
    draw(g, w, h, t, s) {
      const B = BANDA[s.banda];
      g.fillStyle = C.bg; g.fillRect(0, 0, w, h);
      const sw = w * .62, gy = h - 70, fx0 = sw * .42, fx1 = sw - 16, th = (gy - 120) * .75;
      // céu, nuvem
      const cy = 92;
      g.fillStyle = 'rgba(200,210,230,.12)';
      for (let i = 0; i < 7; i++) { g.beginPath(); g.ellipse(sw * .2 + i * sw * .1, cy + (i % 2) * 8, 46, 16, 0, 0, 7); g.fill(); }
      label(g, 'nuvem: transparente para micro-ondas', sw * .2 - 40, cy + 36, C.mute, MONO_S);
      // solo e árvores
      g.fillStyle = C.ground; g.fillRect(0, gy, sw, h - gy);
      const TX = x => lerp(fx0, fx1, x);
      s.trees.forEach(tr => {
        const x = TX(tr.x), hh = th * tr.h;
        g.strokeStyle = C.trunk; g.lineWidth = 5; g.beginPath(); g.moveTo(x, gy); g.lineTo(x, gy - hh * .55); g.stroke();
        g.lineWidth = 2; for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(x, gy - hh * (.45 + k * .1)); g.lineTo(x + (k % 2 ? 1 : -1) * tr.w * sw * .9, gy - hh * (.55 + k * .1)); g.stroke(); }
        g.fillStyle = 'rgba(63,143,79,.8)'; g.beginPath(); g.ellipse(x, gy - hh * .8, tr.w * sw * 1.2, hh * .26, 0, 0, 7); g.fill();
      });
      // feixe oblíquo
      const sx = 30, sy = 26; satIcon(g, sx + 14, sy, 13, C.radar);
      const tx = (fx0 + fx1) / 2, ty = gy - th * .5;
      const ang = Math.atan2(ty - sy, tx - sx), len = Math.hypot(tx - sx, ty - sy);
      const canopyTop = gy - th, depthPx = th * Math.min(1.05, B.pen);
      const wl = lerp(6, 70, Math.sqrt(B.lam / 69));
      g.save(); g.translate(sx + 14, sy + 8); g.rotate(ang);
      const entry = (canopyTop - sy) / Math.sin(ang);
      const reach = entry + depthPx / Math.sin(ang);
      g.lineWidth = 2;
      for (let band = -1; band <= 1; band++) {
        g.beginPath();
        for (let d = 0; d < Math.min(len + 60, reach + 30); d += 2) {
          let a = 9;
          if (d > entry) a *= Math.max(0, 1 - (d - entry) / (reach - entry + 1e-3));
          const y = band * 16 + a * Math.sin((d - t * 120) / wl * Math.PI * 2);
          d ? g.lineTo(d, y) : g.moveTo(d, y);
        }
        g.strokeStyle = `rgba(196,155,255,${band ? .45 : .95})`; g.stroke();
      }
      g.restore();
      label(g, `λ ≈ ${fmt(B.lam, B.lam < 10 ? 1 : 0)} cm`, sx + 38, sy + 4, C.radar, MONO);
      // penetração
      const pen = Math.min(1, B.pen);
      g.fillStyle = 'rgba(196,155,255,.10)'; g.fillRect(fx0 - 10, canopyTop, fx1 - fx0 + 20, Math.min(th + 4, depthPx));
      g.strokeStyle = 'rgba(196,155,255,.7)'; g.setLineDash([4, 3]); g.beginPath(); g.moveTo(fx0 - 10, canopyTop + Math.min(th, depthPx)); g.lineTo(fx1 + 6, canopyTop + Math.min(th, depthPx)); g.stroke(); g.setLineDash([]);
      label(g, pen >= 1 ? 'alcança o chão' : `penetra ~${Math.round(pen * 100)} % da copa`, fx1 + 4, canopyTop + Math.min(th, depthPx) - 5, C.radar, MONO_S, 'right');
      // mecanismos de retorno
      const pulse = .5 + .5 * Math.sin(t * 3);
      const mec = [['volume (copa)', B.mec[0], tx - 20, canopyTop + th * .22, '#7bd389'], ['duplo salto (tronco-chão)', B.mec[1], TX(.62), gy - 4, '#ffb347'], ['superfície (chão)', B.mec[2], TX(.28), gy - 2, '#9fb4ff']];
      mec.forEach(([n, v, x, y, col]) => {
        if (n.startsWith('duplo') && pen < .6) v *= pen / .6;
        g.strokeStyle = col; g.globalAlpha = .35 + .6 * pulse * clamp(v * 1.4); g.lineWidth = 1 + v * 7;
        g.beginPath(); g.moveTo(x, y); g.lineTo(lerp(x, sx + 14, .35), lerp(y, sy, .35)); g.stroke(); g.globalAlpha = 1;
      });
      // painel de barras
      const px = sw + 26, pw = w - px - 16;
      label(g, `BANDA ${B.nome} · ${B.ex}`, px, 30, C.ink, MONO);
      label(g, 'o que volta ao satélite', px, 50, C.mute, MONO_S);
      mec.forEach(([n, v, , , col], i) => {
        if (n.startsWith('duplo') && pen < .6) v *= pen / .6;
        const y = 66 + i * 34;
        label(g, n, px, y, C.ink, MONO_S);
        g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(px, y + 6, pw, 10);
        g.fillStyle = col; g.fillRect(px, y + 6, pw * v, 10);
      });
      // saturação com a biomassa
      const sy0 = 190, sh = h - sy0 - 56;
      label(g, 'sinal × biomassa (ilustrativo)', px, sy0 - 8, C.mute, MONO_S);
      g.strokeStyle = C.axis; g.beginPath(); g.moveTo(px, sy0); g.lineTo(px, sy0 + sh); g.lineTo(px + pw, sy0 + sh); g.stroke();
      ['C', 'L', 'P'].forEach(k => {
        const b = BANDA[k]; g.strokeStyle = k === s.banda ? C.radar : 'rgba(196,155,255,.3)'; g.lineWidth = k === s.banda ? 2.4 : 1.2;
        g.beginPath(); for (let m = 0; m <= 400; m += 5) { const x = px + m / 400 * pw, y = sy0 + sh - (1 - Math.exp(-m / (b.sat * .55))) * sh * .9; m ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
        const ex = px + Math.min(1, b.sat * 1.25 / 400) * pw; label(g, k, ex, sy0 + sh - (1 - Math.exp(-b.sat * 1.25 / (b.sat * .55))) * sh * .9 - 6, k === s.banda ? C.radar : C.mute, MONO_S, 'center');
      });
      [0, 200, 400].forEach(m => label(g, m, px + m / 400 * pw, sy0 + sh + 13, C.mute, MONO_S, 'center'));
      label(g, 'Mg/ha', px + pw, sy0 + sh + 26, C.mute, MONO_S, 'right');
      label(g, `Satura perto de ~${B.sat} Mg/ha (ordem de grandeza)`, 14, h - 14, C.mute, MONO);
    }
  };

  /* ============ FUSÃO GEDI + IMAGEM → ALTURA DO DOSSEL ============ */
  const HMAP = { agua: 0, mata: 24, cerrado: 5, campo: .5, pivo: .6, lavoura: .4, estrada: 0 };
  function ramp(hh) { const t = clamp(hh / 30); const stops = [[0, [236, 226, 196]], [.15, [196, 206, 120]], [.35, [104, 168, 92]], [.65, [36, 112, 92]], [1, [14, 52, 70]]];
    for (let i = 1; i < stops.length; i++) if (t <= stops[i][0]) { const [a, ca] = stops[i - 1], [b, cb] = stops[i], u = (t - a) / (b - a); return `rgb(${ca.map((v, j) => Math.round(lerp(v, cb[j], u))).join(',')})`; } return 'rgb(14,52,70)'; }
  LABS.fusao = {
    controles: () => [],
    padrao: () => ({}),
    init(s) {
      const L = landscape(), n = vnoise(51), r = rng(8);
      const H = new Float32Array(L.W * L.H), P = new Float32Array(L.W * L.H);
      for (let y = 0; y < L.H; y++) for (let x = 0; x < L.W; x++) {
        const c = L.cls[y * L.W + x]; let hh = HMAP[c];
        if (c === 'mata') hh = 16 + 16 * n(x / 6, y / 6);
        if (c === 'cerrado') hh = 2.5 + 5 * n(x / 4, y / 4);
        H[y * L.W + x] = hh;
      }
      for (let y = 0; y < L.H; y++) for (let x = 0; x < L.W; x++) { // previsão: suavizada, subestima alto, superestima baixo
        let s2 = 0, k = 0; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < L.W && yy < L.H) { s2 += H[yy * L.W + xx]; k++; } }
        const m = s2 / k; P[y * L.W + x] = Math.max(0, m > 18 ? 18 + (m - 18) * .45 : m < 3 ? m + 1.1 * (1 - m / 3) + (r() - .5) : m + (r() - .5) * 1.5);
      }
      const shots = [];
      for (let tr = 0; tr < 8; tr++) for (let i = 0; i < 60; i++) {
        const x = 6 + i * 2.4 + tr * 1.2, y = 8 + tr * 10 + i * .55; const xi = Math.round(x), yi = Math.round(y);
        if (xi < L.W && yi < L.H) shots.push({ x: xi, y: yi, h: Math.max(0, H[yi * L.W + xi] + gauss(r) * 1.2) });
      }
      const mk = (fn) => { const c = document.createElement('canvas'); c.width = L.W; c.height = L.H; const g = c.getContext('2d'); for (let y = 0; y < L.H; y++) for (let x = 0; x < L.W; x++) { g.fillStyle = fn(x, y); g.fillRect(x, y, 1, 1); } return c; };
      const opt = { est: 'chuva', modo: 'falsa' }; LABS.optico.init(opt, 'sentinel2');
      const pred = mk((x, y) => ramp(P[y * L.W + x]));
      const err = mk((x, y) => { const d = P[y * L.W + x] - H[y * L.W + x], t = clamp(Math.abs(d) / 8); return d < 0 ? `rgb(${Math.round(lerp(240, 40, t))},${Math.round(lerp(240, 110, t))},${Math.round(lerp(240, 220, t))})` : `rgb(${Math.round(lerp(240, 220, t))},${Math.round(lerp(240, 70, t))},${Math.round(lerp(240, 50, t))})`; });
      shots.forEach(q => { q.p = P[q.y * L.W + q.x]; });
      Object.assign(s, { L, shots, img: opt.img, pred, err, restart: true });
    },
    draw(g, w, h, t, s) {
      if (s.restart) { s.tStart = t; s.restart = false; }
      const tt = t - s.tStart, L = s.L, st = s.estagio || 0;
      g.fillStyle = C.bg; g.fillRect(0, 0, w, h);
      const pw = (w - 70) / 3, ph = pw * L.H / L.W, y0 = 52;
      const xs = [14, 14 + pw + 21, 14 + 2 * (pw + 21)];
      g.imageSmoothingEnabled = false;
      // 1. imagem + pegadas
      label(g, 'ENTRADA', xs[0], y0 - 26, C.ink, MONO); label(g, 'Sentinel-2 (falsa-cor) + pegadas GEDI', xs[0], y0 - 12, C.mute, MONO_S);
      g.drawImage(s.img, xs[0], y0, pw, ph);
      const nShots = st === 0 ? Math.floor(clamp(tt / 3) * s.shots.length) : s.shots.length;
      for (let i = 0; i < nShots; i++) { const q = s.shots[i]; g.fillStyle = ramp(q.h); g.strokeStyle = '#0a1020'; g.lineWidth = 1; g.beginPath(); g.arc(xs[0] + (q.x + .5) / L.W * pw, y0 + (q.y + .5) / L.H * ph, 2.6, 0, 7); g.fill(); g.stroke(); }
      // 2. rede
      label(g, 'REDE NEURAL', xs[1], y0 - 26, C.ink, MONO); label(g, 'aprende pixel → altura', xs[1], y0 - 12, C.mute, MONO_S);
      const layers = [5, 7, 7, 4, 1], act = st >= 1;
      const nodes = layers.map((n, li) => Array.from({ length: n }, (_, i) => [xs[1] + 12 + li * (pw - 24) / (layers.length - 1), y0 + ph / 2 + (i - (n - 1) / 2) * Math.min(22, ph / (n + 1))]));
      for (let li = 0; li < layers.length - 1; li++) for (const a of nodes[li]) for (const b of nodes[li + 1]) {
        const ph2 = act ? .5 + .5 * Math.sin(tt * 4 - li * 1.2 + a[1] * .05) : 0;
        g.strokeStyle = act ? `rgba(255,201,74,${.06 + .3 * ph2})` : 'rgba(150,175,215,.12)'; g.lineWidth = 1; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke();
      }
      nodes.flat().forEach(([x, y]) => { g.fillStyle = act ? '#ffc94a' : '#2a3a55'; g.beginPath(); g.arc(x, y, 4, 0, 7); g.fill(); });
      // 3. saída
      const outT = st === 3 ? 'ERRO (previsto − real)' : 'SAÍDA';
      label(g, outT, xs[2], y0 - 26, C.ink, MONO); label(g, st === 3 ? 'azul: subestima · vermelho: superestima' : 'mapa de altura do dossel', xs[2], y0 - 12, C.mute, MONO_S);
      g.fillStyle = '#121a2c'; g.fillRect(xs[2], y0, pw, ph);
      if (st >= 1) {
        const src = st === 3 ? s.err : s.pred;
        const rows = st === 1 ? Math.floor(clamp(tt / 5) * L.H) : L.H;
        if (rows > 0) g.drawImage(src, 0, 0, L.W, rows, xs[2], y0, pw, ph * rows / L.H);
      } else label(g, '?', xs[2] + pw / 2, y0 + ph / 2 + 8, C.mute, '600 28px "IBM Plex Mono", monospace', 'center');
      [0, 1, 2].forEach(i => { g.strokeStyle = 'rgba(190,205,230,.35)'; g.strokeRect(xs[i], y0, pw, ph); });
      // setas
      g.fillStyle = C.mute; [0, 1].forEach(i => { const x = xs[i] + pw + 4, y = y0 + ph / 2; g.beginPath(); g.moveTo(x, y - 6); g.lineTo(x + 12, y); g.lineTo(x, y + 6); g.fill(); });
      // legenda de altura
      const ly = y0 + ph + 30, lw = Math.min(260, w * .4);
      if (st !== 3) {
        for (let i = 0; i < lw; i++) { g.fillStyle = ramp(i / lw * 30); g.fillRect(14 + i, ly, 1, 10); }
        [0, 10, 20, 30].forEach(v => label(g, v + ' m', 14 + v / 30 * lw, ly + 24, C.mute, MONO_S, 'center'));
        label(g, 'altura do dossel', 14 + lw + 16, ly + 9, C.ink, MONO_S);
      } else {
        label(g, 'Erro maior na mata alta (subestima) e em vegetação baixa e aberta.', 14, ly + 9, C.ink, MONO);
      }
      // dispersão: altura medida pelo GEDI × altura prevista
      const sy0 = ly + 50, sz = Math.min(h - sy0 - 40, 200);
      if (st >= 2 && sz > 80) {
        const sx0 = 54, M = 34, PX = v => sx0 + v / M * sz, PY = v => sy0 + sz - v / M * sz;
        g.strokeStyle = C.axis; g.lineWidth = 1; g.beginPath(); g.moveTo(sx0, sy0); g.lineTo(sx0, sy0 + sz); g.lineTo(sx0 + sz, sy0 + sz); g.stroke();
        g.setLineDash([4, 4]); g.strokeStyle = 'rgba(190,205,230,.5)'; g.beginPath(); g.moveTo(PX(0), PY(0)); g.lineTo(PX(M), PY(M)); g.stroke(); g.setLineDash([]);
        s.shots.forEach(q => { g.fillStyle = ramp(q.h); g.globalAlpha = .85; g.beginPath(); g.arc(PX(q.h), PY(q.p), 2.4, 0, 7); g.fill(); });
        g.globalAlpha = 1;
        [0, 10, 20, 30].forEach(v => { label(g, v, PX(v), sy0 + sz + 13, C.mute, MONO_S, 'center'); label(g, v, sx0 - 6, PY(v) + 3, C.mute, MONO_S, 'right'); });
        label(g, 'medida pelo GEDI (m)', sx0 + sz, sy0 + sz + 26, C.mute, MONO_S, 'right');
        g.save(); g.translate(16, sy0 + sz / 2); g.rotate(-Math.PI / 2); label(g, 'prevista (m)', 0, 0, C.mute, MONO_S, 'center'); g.restore();
        label(g, '1:1', PX(M) - 4, PY(M) + 14, C.mute, MONO_S, 'right');
        const tx = sx0 + sz + 30;
        label(g, 'MEDIDO × PREVISTO', tx, sy0 + 10, C.ink, MONO);
        label(g, 'Cada ponto é uma pegada do GEDI.', tx, sy0 + 32, C.mute, MONO_S);
        label(g, 'Na linha tracejada, a previsão acerta.', tx, sy0 + 48, C.mute, MONO_S);
        label(g, 'Árvores altas ficam abaixo da linha:', tx, sy0 + 72, C.ink, MONO_S);
        label(g, 'o modelo subestima (saturação).', tx, sy0 + 88, C.ink, MONO_S);
        label(g, 'Vegetação baixa fica acima da linha.', tx, sy0 + 112, C.mute, MONO_S);
      }
      label(g, ['Pegadas: amostras de altura medidas pelo lidar', 'A rede aprende com as pegadas e preenche o resto', 'Resultado: altura em todos os pixels', 'Validação: compare com lidar aéreo ou parcelas de campo'][st], 14, h - 14, C.mute, MONO);
    }
  };

  window.LABS = LABS;
})();
