/* Atlas Orbital · modelos 3D procedurais dos satélites.
   Convenção do modelo: +Y = zênite (para longe da Terra), −Y = nadir, +X = direção de voo.
   Unidade ≈ 2 m. Cada modelo devolve:
     root   : THREE.Group
     parts  : [{obj, home, dir}]  na mesma ordem de PARTES[id]
     update(o, e, d) : o = abertura (0 dobrado, 1 aberto), e = explosão (0..1), d = soltar da ISS (GEDI) */
(function () {
  const T = THREE;
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const ease = x => { x = clamp(x); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const seg = (o, a, b) => ease((o - a) / (b - a));
  const lerp = (a, b, t) => a + (b - a) * t;

  function cellTexture(hex) {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const g = c.getContext('2d');
    g.fillStyle = hex; g.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 8; y++) for (let x = 0; x < 4; x++) {
      const gr = g.createLinearGradient(x * 64, y * 32, x * 64 + 64, y * 32 + 32);
      gr.addColorStop(0, 'rgba(120,150,230,.22)'); gr.addColorStop(1, 'rgba(0,0,0,.25)');
      g.fillStyle = gr; g.fillRect(x * 64 + 3, y * 32 + 3, 58, 26);
    }
    g.strokeStyle = 'rgba(200,210,230,.55)'; g.lineWidth = 2;
    for (let i = 0; i <= 256; i += 64) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 256); g.stroke(); }
    for (let i = 0; i <= 256; i += 32) { g.beginPath(); g.moveTo(0, i); g.lineTo(256, i); g.stroke(); }
    const t = new T.CanvasTexture(c); t.anisotropy = 4; return t;
  }
  function foilTexture() {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d');
    g.fillStyle = '#c7962f'; g.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 260; i++) {
      g.fillStyle = `rgba(${Math.random() < .5 ? '255,230,160' : '90,60,10'},${Math.random() * .22})`;
      const x = Math.random() * 128, y = Math.random() * 128;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.random() * 30 - 15, y + Math.random() * 30 - 15); g.lineTo(x + Math.random() * 20, y + Math.random() * 20); g.fill();
    }
    const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; return t;
  }

  let MAT = null;
  function mats() {
    if (MAT) return MAT;
    const S = (o) => new T.MeshStandardMaterial(o);
    MAT = {
      gold: S({ color: 0xffffff, map: foilTexture(), metalness: .55, roughness: .42 }),
      silver: S({ color: 0xb9c0c8, metalness: .55, roughness: .38 }),
      white: S({ color: 0xe3e6ea, metalness: .08, roughness: .62 }),
      grey: S({ color: 0x7d858f, metalness: .4, roughness: .5 }),
      dark: S({ color: 0x23272e, metalness: .35, roughness: .55 }),
      cell: S({ color: 0xffffff, map: cellTexture('#16224a'), metalness: .35, roughness: .32 }),
      cellIss: S({ color: 0xffffff, map: cellTexture('#5a3a12'), metalness: .3, roughness: .4 }),
      glass: S({ color: 0x1a2a48, metalness: .9, roughness: .12 }),
      mirror: S({ color: 0xd8dee8, metalness: 1, roughness: .08 }),
      mesh: S({ color: 0xe0b85a, metalness: .75, roughness: .3, transparent: true, opacity: .62, side: T.DoubleSide }),
      rib: S({ color: 0xe9d9a8, metalness: .5, roughness: .4 }),
      laserR: new T.MeshBasicMaterial({ color: 0xff5a36 }),
      laserG: new T.MeshBasicMaterial({ color: 0x5dff9a }),
      panelL: S({ color: 0x8a6a3a, metalness: .4, roughness: .45 }),
      panelS: S({ color: 0x4c5a7a, metalness: .4, roughness: .45 })
    };
    return MAT;
  }

  const box = (w, h, d, m) => new T.Mesh(new T.BoxGeometry(w, h, d), m);
  const cyl = (r1, r2, h, m, s = 28) => new T.Mesh(new T.CylinderGeometry(r1, r2, h, s), m);
  const at = (o, x, y, z) => { o.position.set(x, y, z); return o; };
  const grp = (...c) => { const g = new T.Group(); c.forEach(o => g.add(o)); return g; };

  /* asa de painel solar: n painéis de pw×ph, estende ao longo de +X local */
  function wing(n, pw, ph, mat) {
    const M = mats();
    const g = new T.Group();
    const yoke = at(box(.5, .05, .05, M.grey), .25, 0, 0); g.add(yoke);
    const panels = [];
    for (let i = 0; i < n; i++) {
      const p = new T.Group();
      const sheet = box(pw * .97, .03, ph, mat || M.cell);
      p.add(sheet);
      g.add(p); panels.push(p);
    }
    g.userData.set = (o) => {
      const a = seg(o, 0, .35);
      g.rotation.z = lerp(Math.PI / 2, 0, a);
      panels.forEach((p, i) => {
        const t = seg(o, .3 + i * (.6 / n), .3 + (i + 1) * (.6 / n) + .05);
        p.position.x = lerp(.55 + pw / 2, .5 + (i + .5) * pw, t);
        p.position.y = lerp(i * .05, 0, t);
      });
      yoke.scale.x = 1;
    };
    g.userData.set(1);
    return g;
  }

  /* refletor parabólico + nervuras */
  function reflector(R, mat) {
    const M = mats();
    const g = new T.Group();
    const f = R * .9, pts = [];
    for (let i = 0; i <= 24; i++) { const r = R * i / 24; pts.push(new T.Vector2(r, r * r / (4 * f))); }
    const dish = new T.Mesh(new T.LatheGeometry(pts, 48), mat || M.mesh);
    g.add(dish);
    const ribs = new T.Group();
    for (let k = 0; k < 18; k++) {
      const a = k / 18 * Math.PI * 2;
      const rg = new T.Group(); rg.rotation.y = a;
      for (let i = 0; i < 6; i++) {
        const r0 = R * i / 6, r1 = R * (i + 1) / 6;
        const y0 = r0 * r0 / (4 * f), y1 = r1 * r1 / (4 * f);
        const len = Math.hypot(r1 - r0, y1 - y0);
        const s = cyl(.025, .025, len, M.rib, 6);
        s.position.set((r0 + r1) / 2, (y0 + y1) / 2 + .01, 0);
        s.rotation.z = -Math.atan2(r1 - r0, y1 - y0);
        rg.add(s);
      }
      ribs.add(rg);
    }
    g.add(ribs);
    const hub = cyl(.18, .18, .25, M.silver); hub.position.y = .05; g.add(hub);
    g.userData.set = (o) => {
      const s = lerp(.06, 1, o);
      dish.scale.set(s, lerp(4, 1, o), s);
      ribs.scale.set(s, lerp(3, 1, o), s);
      g.rotation.y = (1 - o) * 2.4;
    };
    return g;
  }

  function finish(root, parts, deploy) {
    parts.forEach(p => {
      p.home = p.obj.position.clone();
      p.dir = new T.Vector3().fromArray(p.dir);
      p.obj.traverse(m => { if (m.isMesh && m.material && !m.material.isMeshBasicMaterial) m.material = m.material.clone(); });
    });
    const api = { root, parts };
    api.update = (o, e, d) => {
      if (deploy) deploy(o, d || 0);
      parts.forEach(p => {
        if (p.place) p.place(o);
        else p.obj.position.copy(p.home);
        p.obj.position.addScaledVector(p.dir, ease(e));
      });
    };
    api.highlight = (idx) => {
      parts.forEach((p, i) => p.obj.traverse(m => {
        if (m.isMesh && m.material && m.material.emissive) {
          m.material.emissive.setHex(i === idx ? 0x3a6dff : 0x000000);
          m.material.emissiveIntensity = i === idx ? .7 : 0;
        }
      }));
    };
    api.update(1, 0, 0);
    return api;
  }

  const B = {};

  /* ---------------- GEDI na ISS ---------------- */
  B.gedi = () => {
    const M = mats(); const root = new T.Group();
    // ISS: plataforma JEM-EF, módulo Kibo, treliça e painéis
    const iss = new T.Group(); root.add(iss);
    iss.add(at(box(4.2, .14, 2.4, M.silver), 0, -.07, 0));
    for (let i = -1; i <= 1; i += 2) iss.add(at(box(.9, .5, .7, M.white), i * 1.5, .25, -.75));
    const kibo = cyl(1.05, 1.05, 4.2, M.white, 32); kibo.rotation.x = Math.PI / 2; at(kibo, 0, .3, -3.4); iss.add(kibo);
    const truss = box(16, .5, .5, M.grey); at(truss, 0, 1.2, -6.5); iss.add(truss);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const w = box(1.6, .04, 7, M.cellIss); at(w, sx * 6.8, 1.2, -6.5 + sz * 4); iss.add(w);
    }
    // GEDI
    const C = new T.Vector3(0, .62, .2);
    const shell = new T.Group();
    shell.add(box(1.7, .95, 1.15, M.gold));
    shell.add(at(box(1.72, .06, 1.17, M.white), 0, .5, 0));
    at(shell, C.x, C.y, C.z);
    const lasers = new T.Group();
    for (let i = -1; i <= 1; i++) {
      const l = cyl(.09, .09, .95, M.dark, 16); l.rotation.z = Math.PI / 2; at(l, 0, 0, i * .3); lasers.add(l);
      const cap = cyl(.07, .07, .04, M.laserR, 16); cap.rotation.z = Math.PI / 2; at(cap, .49, 0, i * .3); lasers.add(cap);
    }
    at(lasers, C.x - .1, C.y + .18, C.z);
    const bdu = new T.Group();
    for (let i = 0; i < 4; i++) bdu.add(at(box(.13, .13, .13, M.silver), 0, 0, (i - 1.5) * .2));
    at(bdu, C.x + .55, C.y + .18, C.z);
    const tel = new T.Group();
    tel.add(cyl(.42, .42, .42, M.dark, 32));
    tel.add(at(cyl(.38, .38, .02, M.mirror, 32), 0, -.2, 0));
    at(tel, C.x - .3, C.y - .18, C.z);
    const det = at(box(.42, .3, .38, M.silver), C.x + .45, C.y - .2, C.z - .25);
    const st = new T.Group();
    for (let i = -1; i <= 1; i += 2) { const s = cyl(.08, .1, .3, M.dark, 14); s.rotation.x = i * .5; at(s, i * .22, 0, 0); st.add(s); }
    at(st, C.x + .5, C.y + .6, C.z - .4);
    const fram = at(box(1.3, .1, 1.0, M.grey), C.x, .1, C.z);
    const parts = [
      { obj: shell, dir: [0, 1.9, 0] },
      { obj: lasers, dir: [-1.9, .8, .4] },
      { obj: bdu, dir: [1.7, .9, .7] },
      { obj: tel, dir: [-.6, -.4, 1.9] },
      { obj: det, dir: [1.9, -.1, -.6] },
      { obj: st, dir: [.6, 1.2, -1.4] },
      { obj: fram, dir: [0, -.7, 1.4] }
    ];
    parts.forEach(p => root.add(p.obj));
    return finish(root, parts, (o, d) => {
      iss.position.set(0, -3 * ease(d), -7 * ease(d));
      iss.visible = d < .98;
      iss.scale.setScalar(1 - .3 * ease(d));
    });
  };

  /* ---------------- ICESat-2 ---------------- */
  B.icesat2 = () => {
    const M = mats(); const root = new T.Group();
    const bus = new T.Group();
    const hex = cyl(1.0, 1.0, 1.7, M.gold, 6); bus.add(hex);
    bus.add(at(cyl(1.02, 1.02, .05, M.white, 6), 0, .86, 0));
    const laser = at(box(.9, .4, .5, M.silver), -.45, -1.1, .2);
    const doe = new T.Group(); const dd = cyl(.16, .16, .06, M.glass, 20); dd.rotation.z = Math.PI / 2; doe.add(dd);
    doe.add(at(box(.1, .1, .1, M.laserG), .1, 0, 0)); at(doe, .15, -1.05, .45);
    const tel = new T.Group(); tel.add(cyl(.45, .45, .7, M.white, 32)); tel.add(at(cyl(.4, .4, .02, M.mirror, 32), 0, -.36, 0)); at(tel, .3, -1.25, -.3);
    const det = at(box(.45, .35, .4, M.dark), -.55, -1.1, -.45);
    const st = new T.Group(); for (let i = -1; i <= 1; i += 2) { const s = cyl(.08, .1, .3, M.dark, 14); s.rotation.z = i * .4; at(s, i * .25, 0, 0); st.add(s); }
    at(st, 0, 1.05, .4);
    const w = wing(4, 1.0, 1.5); w.rotation.y = -Math.PI / 2; at(w, 0, .3, 1.0);
    const parts = [
      { obj: bus, dir: [0, 0, 0] },
      { obj: laser, dir: [-1.8, -.6, 0] },
      { obj: doe, dir: [1.6, -.4, .9] },
      { obj: tel, dir: [.4, -1.9, -.4] },
      { obj: det, dir: [-1.4, -.4, -1.4] },
      { obj: st, dir: [0, 1.3, .6] },
      { obj: w, dir: [0, 0, .8] }
    ];
    parts.forEach(p => root.add(p.obj));
    return finish(root, parts, (o) => w.userData.set(o));
  };

  /* ---------------- Landsat 9 ---------------- */
  B.landsat9 = () => {
    const M = mats(); const root = new T.Group();
    const bus = new T.Group(); bus.add(box(2.2, 1.6, 1.8, M.gold));
    bus.add(at(box(2.22, .05, 1.82, M.white), 0, .8, 0));
    const oli = new T.Group(); oli.add(box(1.3, 1.1, 1.3, M.white));
    oli.add(at(cyl(.32, .32, .1, M.glass, 24), 0, -.56, 0)); at(oli, .55, -1.35, 0);
    const tirs = new T.Group(); tirs.add(box(.9, .8, .9, M.silver)); tirs.add(at(box(.6, .02, .7, M.white), 0, .41, 0));
    tirs.add(at(cyl(.2, .2, .08, M.glass, 20), 0, -.42, 0)); at(tirs, -.65, -1.2, 0);
    const w = wing(5, 1.1, 1.9); w.rotation.y = Math.PI / 2; at(w, .2, 0, -.9);
    const xa = new T.Group(); const cone = cyl(.04, .26, .3, M.white, 20); xa.add(cone); xa.add(at(cyl(.03, .03, .4, M.grey, 8), 0, .3, 0)); xa.rotation.x = Math.PI; at(xa, -.6, -1.05, .75);
    const st = new T.Group(); for (let i = -1; i <= 1; i += 2) { const s = cyl(.08, .1, .3, M.dark, 14); s.rotation.x = .4 * i; at(s, i * .25, 0, 0); st.add(s); }
    at(st, .6, .98, .55);
    const parts = [
      { obj: bus, dir: [0, 0, 0] },
      { obj: oli, dir: [1.6, -1.1, .3] },
      { obj: tirs, dir: [-1.6, -1.1, .3] },
      { obj: w, dir: [0, 0, -.8] },
      { obj: xa, dir: [-.4, -.6, 1.5] },
      { obj: st, dir: [.3, 1.3, .5] }
    ];
    parts.forEach(p => root.add(p.obj));
    return finish(root, parts, (o) => w.userData.set(o));
  };

  /* ---------------- Sentinel-2 ---------------- */
  B.sentinel2 = () => {
    const M = mats(); const root = new T.Group();
    const bus = new T.Group(); bus.add(box(1.6, 2.0, 1.5, M.gold)); bus.add(at(box(1.62, .05, 1.52, M.white), 0, 1.0, 0));
    const tel = new T.Group();
    for (let i = 0; i < 3; i++) { const m = cyl(.26 - i * .04, .26 - i * .04, .05, M.mirror, 24); m.rotation.x = .5 - i * .4; at(m, (i - 1) * .35, i * .12, 0); tel.add(m); }
    tel.add(at(box(1.2, .06, .7, M.white), 0, -.2, 0));
    at(tel, 0, -1.25, .1);
    const dic = at(box(.22, .22, .04, M.glass), .55, -1.2, -.35);
    const vnir = at(box(.5, .14, .3, M.dark), -.4, -1.15, -.45);
    const swir = at(box(.36, .18, .26, M.silver), .1, -1.15, -.5);
    const dif = at(box(.9, .04, .6, M.white), 0, -1.55, .2);
    const w = wing(3, 1.15, 2.0); w.rotation.y = -Math.PI / 2; at(w, 0, .3, .75);
    const parts = [
      { obj: bus, dir: [0, 0, 0] },
      { obj: tel, dir: [0, -1.6, .9] },
      { obj: dic, dir: [1.7, -.5, -.4] },
      { obj: vnir, dir: [-1.8, -.5, -.6] },
      { obj: swir, dir: [.4, -.4, -1.9] },
      { obj: dif, dir: [0, -2.4, 0] },
      { obj: w, dir: [0, 0, .8] }
    ];
    parts.forEach(p => root.add(p.obj));
    return finish(root, parts, (o) => {
      w.userData.set(o);
      dif.rotation.x = lerp(0, -.9, seg(o, .6, 1));
    });
  };

  /* ---------------- Amazonia-1 ---------------- */
  B.amazonia1 = () => {
    const M = mats(); const root = new T.Group();
    const pmm = new T.Group(); pmm.add(box(1.5, 1.2, 1.5, M.gold)); pmm.add(at(box(1.52, .05, 1.52, M.white), 0, .6, 0));
    const pay = at(box(1.4, .8, 1.4, M.white), 0, -1.0, 0);
    const wfi = new T.Group();
    for (let i = -1; i <= 1; i += 2) { const c = cyl(.2, .26, .45, M.dark, 24); c.rotation.z = i * .28; at(c, i * .22, 0, 0); wfi.add(c); wfi.add(at(cyl(.18, .18, .02, M.glass, 20), i * .28, -.24, 0)); }
    at(wfi, 0, -1.6, 0);
    const w = wing(3, 1.25, 1.6); w.rotation.y = Math.PI / 2; at(w, 0, .1, -.75);
    const tx = new T.Group(); tx.add(cyl(.05, .2, .25, M.white, 16)); tx.rotation.x = Math.PI; at(tx, .55, -1.5, .5);
    const parts = [
      { obj: pmm, dir: [0, .9, 0] },
      { obj: pay, dir: [0, 0, 0] },
      { obj: wfi, dir: [0, -1.3, .8] },
      { obj: w, dir: [0, 0, -.8] },
      { obj: tx, dir: [1.4, -.4, .9] }
    ];
    parts.forEach(p => root.add(p.obj));
    return finish(root, parts, (o) => w.userData.set(o));
  };

  /* ---------------- Sentinel-1 ---------------- */
  B.sentinel1 = () => {
    const M = mats(); const root = new T.Group();
    const bus = new T.Group(); bus.add(box(1.5, 1.4, 1.3, M.gold)); bus.add(at(box(1.52, .05, 1.32, M.white), 0, .7, 0));
    const ant = new T.Group(); const segs = [];
    for (let k = -2; k <= 2; k++) {
      const s = new T.Group();
      s.add(box(1.22, .42, .07, M.dark));
      for (let j = 0; j < 4; j++) s.add(at(box(.27, .36, .01, M.grey), -.45 + j * .3, 0, .04));
      s.userData.k = k; ant.add(s); segs.push(s);
    }
    ant.rotation.x = -.55; at(ant, 0, -.35, .85);
    const wings = new T.Group();
    const w1 = wing(4, 1.2, 1.3); w1.rotation.y = 0; at(w1, .6, .2, -.75);
    const w2 = wing(4, 1.2, 1.3); w2.rotation.y = Math.PI; at(w2, -.6, .2, -.75);
    wings.add(w1, w2);
    const ocp = new T.Group(); ocp.add(cyl(.18, .18, .25, M.silver, 18)); ocp.add(at(new T.Mesh(new T.SphereGeometry(.15, 16, 12), M.glass), 0, .18, 0)); at(ocp, .4, .85, .3);
    const xa = new T.Group(); xa.add(cyl(.04, .22, .25, M.white, 16)); xa.rotation.x = Math.PI; at(xa, -.45, -.85, -.3);
    const parts = [
      { obj: bus, dir: [0, 0, 0] },
      { obj: ant, dir: [0, -.6, 1.4] },
      { obj: wings, dir: [0, .3, -1.0] },
      { obj: ocp, dir: [.3, 1.4, .3] },
      { obj: xa, dir: [-.6, -1.3, -.4] }
    ];
    parts.forEach(p => root.add(p.obj));
    return finish(root, parts, (o) => {
      w1.userData.set(o); w2.userData.set(o);
      segs.forEach(s => {
        const k = s.userData.k, a = Math.abs(k);
        const t = a === 0 ? 1 : seg(o, a === 1 ? .2 : .5, a === 1 ? .55 : .9);
        s.position.x = lerp(0, k * 1.24, t);
        s.position.z = lerp(a * .08, 0, t);
      });
    });
  };

  /* refletor em braço (NISAR, BIOMASS) */
  function boomReflector(root, hingePos, finalDir, len, R, feedPos) {
    const M = mats();
    const piv = new T.Group(); piv.position.copy(hingePos);
    const s1 = cyl(.07, .07, len / 2, M.white, 10); s1.rotation.z = -Math.PI / 2; s1.position.x = len / 4; piv.add(s1);
    const elbow = new T.Group(); elbow.position.x = len / 2; piv.add(elbow);
    const s2 = cyl(.07, .07, len / 2, M.white, 10); s2.rotation.z = -Math.PI / 2; s2.position.x = len / 4; elbow.add(s2);
    const tip = new T.Object3D(); tip.position.x = len / 2; elbow.add(tip);
    const yaw = Math.atan2(-finalDir.z, finalDir.x), pitch = Math.asin(finalDir.y);
    const boom = new T.Group(); boom.add(piv);
    const refl = reflector(R);
    const tmp = new T.Vector3(), up = new T.Vector3(0, 1, 0);
    const deploy = (o) => {
      const a = seg(o, 0, .45);
      piv.rotation.set(0, lerp(yaw + 1.3, yaw, a), lerp(-1.2, pitch, a));
      piv.rotation.order = 'YZX';
      elbow.rotation.z = lerp(-Math.PI * .95, 0, a);
      refl.userData.set(seg(o, .45, 1));
    };
    const place = () => {
      root.updateMatrixWorld(true);
      tip.getWorldPosition(tmp); root.worldToLocal(tmp);
      refl.position.copy(tmp);
      const v = feedPos.clone().sub(tmp).normalize();
      refl.quaternion.setFromUnitVectors(up, v);
    };
    return { boom, refl, deploy, place };
  }

  /* ---------------- NISAR ---------------- */
  B.nisar = () => {
    const M = mats(); const root = new T.Group();
    const bus = new T.Group(); bus.add(box(1.6, 1.6, 1.6, M.gold)); bus.add(at(box(1.62, .05, 1.62, M.white), 0, -.8, 0));
    const strc = new T.Group(); strc.add(cyl(.8, .8, 1.3, M.gold, 8)); strc.add(at(cyl(.82, .82, .05, M.white, 8), 0, .66, 0)); at(strc, 0, 1.45, 0);
    const feedL = at(box(.08, 1.0, 1.1, M.panelL), .85, 1.45, -.15);
    const feedS = at(box(.08, .5, .5, M.panelS), .85, 1.6, .6);
    const feedPos = new T.Vector3(.9, 1.45, 0);
    const br = boomReflector(root, new T.Vector3(.5, 2.0, 0), new T.Vector3(.86, .5, 0).normalize(), 4.6, 3.0, feedPos);
    const w1 = wing(4, 1.1, 1.4); w1.rotation.y = Math.PI / 2; at(w1, 0, 0, -.8);
    const w2 = wing(4, 1.1, 1.4); w2.rotation.y = -Math.PI / 2; at(w2, 0, 0, .8);
    const wings = grp(w1, w2);
    const parts = [
      { obj: bus, dir: [0, -.6, 0] },
      { obj: strc, dir: [-1.4, .4, 0] },
      { obj: feedL, dir: [.6, -.5, -1.6] },
      { obj: feedS, dir: [.6, .2, 1.8] },
      { obj: br.boom, dir: [0, .6, 0] },
      { obj: br.refl, dir: [1.2, .8, 0], place: null },
      { obj: wings, dir: [-.6, -.6, 0] }
    ];
    parts[5].place = () => br.place();
    parts.forEach(p => root.add(p.obj));
    const api = finish(root, parts, (o) => { w1.userData.set(o); w2.userData.set(o); br.deploy(o); });
    // o braço também precisa acompanhar a explosão para o refletor seguir a ponta
    return api;
  };

  /* ---------------- BIOMASS ---------------- */
  B.biomass = () => {
    const M = mats(); const root = new T.Group();
    const bus = new T.Group(); bus.add(box(1.5, 2.1, 1.4, M.gold)); bus.add(at(box(1.52, .05, 1.42, M.white), 0, 1.05, 0));
    const feed = new T.Group(); feed.add(box(.5, .5, .5, M.silver)); feed.add(at(box(.06, .9, .9, M.panelL), .28, 0, 0)); at(feed, .9, .4, 0);
    const feedPos = new T.Vector3(1.2, .4, 0);
    const br = boomReflector(root, new T.Vector3(.6, -.9, 0), new T.Vector3(.75, -.66, 0).normalize(), 4.2, 3.0, feedPos);
    const w1 = wing(3, 1.15, 1.6); w1.rotation.y = Math.PI / 2; at(w1, -.2, .5, -.75);
    const w2 = wing(3, 1.15, 1.6); w2.rotation.y = -Math.PI / 2; at(w2, -.2, .5, .75);
    const wings = grp(w1, w2);
    const parts = [
      { obj: bus, dir: [-.4, 0, 0] },
      { obj: feed, dir: [-.2, 1.4, .6] },
      { obj: br.boom, dir: [0, -.4, 0] },
      { obj: br.refl, dir: [1.0, -.6, 0] },
      { obj: wings, dir: [-.8, .5, 0] }
    ];
    parts[3].place = () => br.place();
    parts.forEach(p => root.add(p.obj));
    return finish(root, parts, (o) => { w1.userData.set(o); w2.userData.set(o); br.deploy(o); });
  };

  window.buildModel = (id) => B[id]();
})();
