/* Atlas Orbital · motor da aula */
(function () {
  const T = THREE;
  const $ = s => document.querySelector(s);
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeIO = x => { x = clamp(x); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const KM = 1 / 6371;
  const Q = new URLSearchParams(location.search);
  const REDUZ = matchMedia('(prefers-reduced-motion: reduce)').matches || Q.has('instant');
  const TEX = window.TEX || { terra: 'assets/terra.jpg', noite: 'assets/noite.jpg', agua: 'assets/agua.jpg' };
  const CERRADO = { lat: -15.8, lon: -47.9 };

  /* ---------- passos ---------- */
  const STEPS = [];
  CAPS.forEach((cap, ci) => cap.passos.forEach((p, pi) => STEPS.push(Object.assign({ ci, pi, cap }, p))));
  let cur = -1;

  /* ---------- renderer e cena ---------- */
  const canvas = $('#gl');
  const renderer = new T.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.outputEncoding = T.sRGBEncoding;
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(40, 1, 0.0004, 400);
  const SUN = new T.Vector3(1, .18, .55).normalize();
  const sunL = new T.DirectionalLight(0xfff1df, 2.4); sunL.position.copy(SUN).multiplyScalar(10); scene.add(sunL);
  scene.add(new T.AmbientLight(0x3a4a6a, .55));
  scene.add(new T.HemisphereLight(0x8fb0ff, 0x1a1208, .35));

  // estrelas
  (() => {
    const n = 4000, pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const u = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2, r = 150;
      pos.set([r * Math.sqrt(1 - u * u) * Math.cos(a), r * u, r * Math.sqrt(1 - u * u) * Math.sin(a)], i * 3);
      const b = .35 + Math.random() * .65; col.set([b, b * (.9 + Math.random() * .1), b], i * 3);
    }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setAttribute('color', new T.BufferAttribute(col, 3));
    scene.add(new T.Points(g, new T.PointsMaterial({ size: 1.3, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: .9 })));
  })();

  // Terra
  const earth = new T.Group(); scene.add(earth);
  const loader = new T.TextureLoader();
  const tDay = loader.load(TEX.terra), tNight = loader.load(TEX.noite), tWater = loader.load(TEX.agua);
  [tDay, tNight, tWater].forEach(t => { t.anisotropy = renderer.capabilities.getMaxAnisotropy(); });
  const earthMat = new T.ShaderMaterial({
    uniforms: { day: { value: tDay }, night: { value: tNight }, water: { value: tWater }, sun: { value: SUN.clone() }, dim: { value: 1 } },
    vertexShader: `varying vec2 vUv; varying vec3 vN; varying vec3 vW;
      void main(){ vUv=uv; vN=normalize(mat3(modelMatrix)*normal); vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`,
    fragmentShader: `uniform sampler2D day,night,water; uniform vec3 sun; uniform float dim; varying vec2 vUv; varying vec3 vN; varying vec3 vW;
      void main(){ vec3 n=normalize(vN); float d=dot(n,sun); float l=smoothstep(-.12,.22,d);
        vec3 dc=pow(texture2D(day,vUv).rgb,vec3(1.08)); vec3 nc=texture2D(night,vUv).rgb;
        vec3 v=normalize(cameraPosition-vW); vec3 h=normalize(sun+v);
        float w=texture2D(water,vUv).r; float sp=pow(max(dot(n,h),0.),60.)*w*.9*l;
        vec3 c=mix(nc*vec3(1.,.82,.55)*1.3+dc*.035, dc*(.12+1.05*max(d,0.)), l)+sp*vec3(1.,.93,.8);
        float f=pow(1.-max(dot(n,v),0.),3.); c+=vec3(.25,.5,1.)*f*(.25+.6*l);
        gl_FragColor=vec4(c*dim,1.); }`
  });
  const globe = new T.Mesh(new T.SphereGeometry(1, 160, 80), earthMat); earth.add(globe);
  const atmo = new T.Mesh(new T.SphereGeometry(1.025, 96, 48), new T.ShaderMaterial({
    uniforms: { sun: { value: SUN.clone() } }, side: T.BackSide, transparent: true, depthWrite: false, blending: T.AdditiveBlending,
    vertexShader: `varying vec3 vN; varying vec3 vW; void main(){ vN=normalize(mat3(modelMatrix)*normal); vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`,
    fragmentShader: `uniform vec3 sun; varying vec3 vN; varying vec3 vW; void main(){ vec3 v=normalize(cameraPosition-vW); float r=1.-abs(dot(normalize(vN),v)); float i=pow(r,5.)*1.6; float l=smoothstep(-.3,.4,dot(normalize(vW),sun)); gl_FragColor=vec4(vec3(.35,.6,1.)*i*(.25+.85*l),i); }`
  }));
  scene.add(atmo);

  function ll(lat, lon, r = 1) {
    const ph = (lon + 180) * Math.PI / 180, th = (90 - lat) * Math.PI / 180;
    return new T.Vector3(-Math.cos(ph) * Math.sin(th) * r, Math.cos(th) * r, Math.sin(ph) * Math.sin(th) * r);
  }
  // marcador do Cerrado e linhas de latitude do GEDI
  const cerradoMark = new T.Mesh(new T.RingGeometry(.012, .017, 40), new T.MeshBasicMaterial({ color: 0xffc94a, transparent: true, opacity: .9, side: T.DoubleSide, depthWrite: false }));
  cerradoMark.position.copy(ll(CERRADO.lat, CERRADO.lon, 1.002)); cerradoMark.lookAt(ll(CERRADO.lat, CERRADO.lon, 2)); earth.add(cerradoMark);
  const latLines = new T.Group(); earth.add(latLines);
  [51.6, -51.6].forEach(lat => {
    const pts = []; for (let i = 0; i <= 256; i++) pts.push(ll(lat, -180 + i * 360 / 256, 1.003));
    const l = new T.Line(new T.BufferGeometry().setFromPoints(pts), new T.LineDashedMaterial({ color: 0xff6a3d, dashSize: .02, gapSize: .015, transparent: true, opacity: .9 }));
    l.computeLineDistances(); latLines.add(l);
  });
  latLines.visible = false;

  /* ---------- órbitas ---------- */
  function orbitPos(inc, raan, u, r) {
    const i = inc * Math.PI / 180, O = raan * Math.PI / 180;
    let x = Math.cos(u), y = 0, z = Math.sin(u);
    const y1 = y * Math.cos(i) - z * Math.sin(i), z1 = y * Math.sin(i) + z * Math.cos(i);
    y = y1; z = z1;
    return new T.Vector3(x * Math.cos(O) + z * Math.sin(O), y, -x * Math.sin(O) + z * Math.cos(O)).multiplyScalar(r);
  }
  const glowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.25, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new T.CanvasTexture(c); })();
  const fleet = new T.Group(); scene.add(fleet);
  const SID = Object.keys(SATS);
  const SO = {};
  const labelsEl = $('#labels');
  SID.forEach(id => {
    const s = SATS[id], r = 1 + s.alt * KM;
    const a = (6371 + s.alt) / 6371, period = 2 * Math.PI * Math.sqrt(Math.pow(a, 3)); // relativo
    const pts = []; for (let k = 0; k <= 256; k++) pts.push(orbitPos(s.inc, s.raan, k / 256 * Math.PI * 2, r));
    const ring = new T.Line(new T.BufferGeometry().setFromPoints(pts), new T.LineBasicMaterial({ color: s.cor, transparent: true, opacity: .45 }));
    const dot = new T.Mesh(new T.SphereGeometry(.009, 12, 8), new T.MeshBasicMaterial({ color: s.cor }));
    const glow = new T.Sprite(new T.SpriteMaterial({ map: glowTex, color: s.cor, transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
    glow.scale.setScalar(.07); dot.add(glow);
    const hit = new T.Mesh(new T.SphereGeometry(.045, 8, 6), new T.MeshBasicMaterial({ visible: false })); hit.userData.id = id; dot.add(hit);
    fleet.add(ring, dot);
    const lab = document.createElement('button'); lab.className = 'satlbl'; lab.type = 'button';
    lab.innerHTML = `<i style="background:${s.cor}"></i>${s.nome}`; lab.addEventListener('click', () => goCap(id)); labelsEl.appendChild(lab);
    SO[id] = { ring, dot, hit, lab, r, u: s.fase0, w: 2 * Math.PI / (period * 26) };
  });

  /* ---------- modelo em foco ---------- */
  const focus = new T.Group(); scene.add(focus);
  const modelHolder = new T.Group(); focus.add(modelHolder);
  const MODEL_SCALE = .0042;
  const models = {};
  let fSat = null, model = null;
  const st = { o: 1, e: 0, d: 0 };
  const beams = new T.Group(); scene.add(beams);

  function basisAt(up) {
    const x = new T.Vector3(0, 1, 0).cross(up).normalize();
    if (x.lengthSq() < 1e-6) x.set(1, 0, 0);
    const z = x.clone().cross(up).normalize();
    return { x, y: up.clone(), z, q: new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(x, up, z)) };
  }
  function cerradoWorld() { return ll(CERRADO.lat, CERRADO.lon).applyAxisAngle(new T.Vector3(0, 1, 0), earth.rotation.y); }
  function earthAngleForCerrado() {
    const c = ll(CERRADO.lat, CERRADO.lon), az = Math.atan2(SUN.x, SUN.z) - .55;
    return az - Math.atan2(c.x, c.z);
  }

  function buildBeams(id) {
    beams.clear();
    const s = SATS[id], up = cerradoWorld(), B = basisAt(up), P = up.clone().multiplyScalar(1 + s.alt * KM), G = up.clone();
    const col = new T.Color(s.cor);
    const strip = (offKm, wKm, lenU, opacity) => {
      const pos = [], idx = [], n = 40, off = offKm * KM, hw = wKm * KM / 2;
      for (let i = 0; i <= n; i++) {
        const a = lerp(-lenU, lenU, i / n);
        for (const c of [-hw, hw]) pos.push(...G.clone().addScaledVector(B.x, a).addScaledVector(B.z, off + c).normalize().multiplyScalar(1.0012).toArray());
        if (i < n) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
      }
      const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
      const m = new T.Mesh(g, new T.MeshBasicMaterial({ color: col, transparent: true, opacity, side: T.DoubleSide, depthWrite: false }));
      beams.add(m); return m;
    };
    const tri = (a, b, c, op) => { const g = new T.BufferGeometry().setFromPoints([a, b, c]); const m = new T.Mesh(g, new T.MeshBasicMaterial({ color: col, transparent: true, opacity: op, side: T.DoubleSide, depthWrite: false, blending: T.AdditiveBlending })); beams.add(m); };
    const edge = (km) => G.clone().addScaledVector(B.z, km * KM).normalize().multiplyScalar(1.001);
    if (s.tipo === 'lidar') {
      strip(0, Math.max(s.swath, 2), .14, .55);
      const line = new T.Line(new T.BufferGeometry().setFromPoints([P, G]), new T.LineBasicMaterial({ color: col, transparent: true, opacity: .8 }));
      beams.add(line);
      const pulse = new T.Sprite(new T.SpriteMaterial({ map: glowTex, color: col, transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
      pulse.scale.setScalar(.008); pulse.userData = { P, G }; beams.add(pulse); beams.userData.pulse = pulse;
    } else if (s.tipo === 'optico') {
      strip(0, s.swath, .14, .22);
      tri(P, edge(-s.swath / 2), edge(s.swath / 2), .16);
    } else {
      const off = s.alt * Math.tan(32 * Math.PI / 180);
      strip(off, s.swath, .14, .25);
      tri(P, edge(off - s.swath / 2), edge(off + s.swath / 2), .18);
    }
    beams.userData.anchor = { P, G, swathAt: edge(s.tipo === 'radar' ? s.alt * Math.tan(32 * Math.PI / 180) + s.swath / 2 : s.swath / 2 + 2) };
  }

  /* ---------- câmera ---------- */
  const rig = { target: new T.Vector3(), q: new T.Quaternion(), yaw: .4, pitch: .22, dist: 3.6, off: 0 };
  let camFrom = null, camTo = null, camT = 1, camDur = 1.9;
  function poseOverview(extra = {}) { return Object.assign({ target: () => new T.Vector3(), q: () => new T.Quaternion(), yaw: .35, pitch: .28, dist: 3.5 }, extra); }
  function poseFocus(extra = {}) {
    return Object.assign({
      target: () => cerradoWorld().multiplyScalar(1 + SATS[fSat].alt * KM),
      q: () => basisAt(cerradoWorld()).q, yaw: .75, pitch: .2, dist: .075
    }, extra);
  }
  function setCam(pose, dur = 1.9) {
    camFrom = { target: rig.target.clone(), q: rig.q.clone(), yaw: rig.yaw, pitch: rig.pitch, dist: rig.dist };
    camTo = pose; camT = 0; camDur = REDUZ ? .01 : dur;
    user.yaw = 0; user.pitch = 0; user.zoom = 1;
  }
  const user = { yaw: 0, pitch: 0, zoom: 1 };
  function updateCam(dt) {
    if (camTo) {
      camT = Math.min(1, camT + dt / camDur);
      const k = easeIO(camT);
      rig.target.copy(camFrom.target).lerp(camTo.target(), k);
      rig.q.copy(camFrom.q).slerp(camTo.q(), k);
      let dy = camTo.yaw - camFrom.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy));
      rig.yaw = camFrom.yaw + dy * k; rig.pitch = lerp(camFrom.pitch, camTo.pitch, k);
      rig.dist = Math.exp(lerp(Math.log(camFrom.dist), Math.log(camTo.dist), k));
      if (camT >= 1) { /* segue o alvo dinâmico */ }
    }
    const yaw = rig.yaw + user.yaw, pitch = clamp(rig.pitch + user.pitch, -1.2, 1.35), dist = rig.dist * user.zoom;
    const off = new T.Vector3(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)).multiplyScalar(dist).applyQuaternion(rig.q);
    camera.position.copy(rig.target).add(off);
    const minR = fSat ? 1 + SATS[fSat].alt * KM * .25 : 1.08;
    if (camera.position.length() < minR) camera.position.setLength(minR);
    camera.up.set(0, 1, 0).applyQuaternion(rig.q);
    camera.lookAt(rig.target);
  }
  // deslocamento do centro de projeção (abre espaço para cartão e laboratório)
  let viewOff = 0, viewOffTo = 0;
  function computeViewOff() {
    const W = innerWidth; if (W < 860) return 0;
    const card = $('#card').getBoundingClientRect();
    const lab = $('#lab');
    const left = card.right + 10, right = lab.hidden ? W - 10 : lab.getBoundingClientRect().left - 10;
    const s = STEPS[cur];
    if (s && s.view === 'capa') return -(W * .2);
    return W / 2 - (left + right) / 2;
  }

  /* ---------- interação com a cena ---------- */
  let drag = null;
  canvas.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, moved: 0 }; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', e => {
    if (!drag) { hoverPick(e); return; }
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.x = e.clientX; drag.y = e.clientY; drag.moved += Math.abs(dx) + Math.abs(dy);
    user.yaw -= dx * .005; user.pitch += dy * .004;
  });
  canvas.addEventListener('pointerup', e => { if (drag && drag.moved < 5) clickPick(e); drag = null; });
  canvas.addEventListener('wheel', e => { e.preventDefault(); user.zoom = clamp(user.zoom * Math.exp(e.deltaY * .001), .45, 2.6); }, { passive: false });
  const ray = new T.Raycaster(), mouse = new T.Vector2();
  function pickAt(e) {
    if (!fleet.visible) return null;
    mouse.set(e.clientX / innerWidth * 2 - 1, -e.clientY / innerHeight * 2 + 1);
    ray.setFromCamera(mouse, camera);
    const hits = ray.intersectObjects(SID.map(id => SO[id].hit));
    if (!hits.length) return null;
    const id = hits[0].object.userData.id;
    const p = SO[id].dot.position, dpos = ray.ray.origin.distanceTo(p);
    const sph = ray.ray.intersectSphere(new T.Sphere(new T.Vector3(), 1), new T.Vector3());
    if (sph && ray.ray.origin.distanceTo(sph) < dpos) return null;
    return id;
  }
  function hoverPick(e) { canvas.style.cursor = pickAt(e) ? 'pointer' : 'grab'; }
  function clickPick(e) { const id = pickAt(e); if (id) goCap(id); }

  /* ---------- animação dos parâmetros ---------- */
  let seq = [];
  function tweenTo(key, to, dur) { seq.push({ key, to, dur: REDUZ ? .01 : dur }); }
  function runSeq(dt) {
    if (!seq.length) return;
    const a = seq[0];
    if (a.wait != null) { a.wait -= dt; if (a.wait <= 0) seq.shift(); return; }
    if (a.from == null) { a.from = st[a.key]; a.t = 0; }
    a.t = Math.min(1, a.t + dt / a.dur); st[a.key] = lerp(a.from, a.to, easeIO(a.t));
    if (a.t >= 1) seq.shift();
  }
  function playOpen() {
    seq = [];
    if (fSat === 'gedi') { st.o = 1; seq.push({ key: 'e', to: 0, dur: .4 }, { key: 'd', to: 0, dur: .4 }, { wait: .5 }, { key: 'd', to: 1, dur: 2.2 }, { wait: .2 }, { key: 'e', to: 1, dur: 1.6 }); }
    else seq.push({ key: 'e', to: 0, dur: .4 }, { key: 'o', to: 0, dur: 1.0 }, { wait: .6 }, { key: 'o', to: 1, dur: 3.0 }, { wait: .2 }, { key: 'e', to: 1, dur: 1.6 });
    seq.forEach(a => { if (a.dur) a.dur = REDUZ ? .01 : a.dur; if (a.wait) a.wait = REDUZ ? 0 : a.wait; });
  }

  /* ---------- aplicar passo ---------- */
  let earthTarget = null;
  function applyScene(s) {
    const isFocus = !!s.cap.sat && !s.view;
    const id = s.cap.sat;
    latLines.visible = s.destaque === 'orbitas';
    fleet.visible = !isFocus;
    SID.forEach(k => {
      const o = SO[k], tp = SATS[k].tipo;
      let op = .45;
      if (s.destaque === 'orbitas') op = k === 'gedi' ? 1 : (SATS[k].inc > 90 ? .5 : .3);
      if (s.view === 'fusao') op = (k === 'gedi' || k === 'sentinel2') ? .9 : .1;
      o.ring.material.opacity = op;
    });
    if (isFocus) {
      if (fSat !== id) {
        fSat = id;
        if (!models[id]) models[id] = buildModel(id);
        modelHolder.clear(); model = models[id]; modelHolder.add(model.root);
        modelHolder.scale.setScalar(MODEL_SCALE);
        st.o = 1; st.e = 0; st.d = 0; model.update(1, 0, 0);
        earthTarget = earthAngleForCerrado();
        const cur = earth.rotation.y; let d = earthTarget - cur; d = Math.atan2(Math.sin(d), Math.cos(d)); earthTarget = cur + d;
        earth.rotation.y = earthTarget; // posição final para construir os feixes
        buildBeams(id);
        earth.rotation.y = cur; earthFrom = cur; earthT = 0;
      }
      focus.visible = true; beams.visible = s.fase !== 'abrir';
      seq = [];
      const yawBase = fSat === 'nisar' || fSat === 'biomass' ? .95 : .75;
      if (s.fase === 'encontro') { tweenTo('e', 0, .8); tweenTo('d', 0, .1); tweenTo('o', 1, 1.2); setCam(poseFocus({ yaw: yawBase, pitch: .16, dist: fSat === 'gedi' ? .09 : .075 }), 2.4); }
      if (s.fase === 'abrir') { playOpen(); setCam(poseFocus({ yaw: yawBase + .25, pitch: .32, dist: fSat === 'gedi' ? .055 : (fSat === 'nisar' || fSat === 'biomass' ? .11 : .062) }), 1.6); }
      if (s.fase === 'lab') { tweenTo('e', 0, .8); tweenTo('d', 0, .6); tweenTo('o', 1, .8); setCam(poseFocus({ yaw: yawBase - .2, pitch: .1, dist: .1 }), 1.6); }
      if (s.fase === 'dado') { tweenTo('e', 0, .6); tweenTo('d', 0, .6); tweenTo('o', 1, .6); setCam(poseFocus({ yaw: 1.35, pitch: .5, dist: .16 }), 2.0); }
    } else {
      if (fSat) { fSat = null; focus.visible = false; beams.visible = false; earthTarget = null; }
      focus.visible = false; beams.visible = false;
      const pose = s.view === 'capa' ? poseOverview({ yaw: .2, pitch: .2, dist: 3.0 }) : s.view === 'fusao' || s.view === 'quiz' ? poseOverview({ yaw: .6, pitch: .35, dist: 4.2 }) : poseOverview({ yaw: .35, pitch: s.destaque === 'orbitas' ? .55 : .28, dist: 3.4 });
      setCam(pose, 2.0);
    }
    earthMat.uniforms.dim.value = (s.view === 'fusao' || s.view === 'quiz') ? .55 : 1;
  }
  let earthFrom = 0, earthT = 1;

  /* ---------- cartão ---------- */
  const card = $('#card');
  function esc(t) { return String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
  function renderCard(s) {
    const cap = s.cap, sat = cap.sat ? SATS[cap.sat] : null;
    const total = cap.passos.length;
    let h = '';
    if (s.view === 'capa') {
      h += `<div class="eyebrow">Curso de Geografia · Sensoriamento Remoto</div>
        <h1 class="capa">${esc(s.h)}</h1><p class="sub">${esc(s.sub)}</p><p>${s.p}</p>
        <button class="go" type="button" data-next>Começar a aula</button>
        <p class="dica">${esc(s.dica)}</p>
        <p class="credito">Canopy Forest · Cerrado</p>`;
    } else {
      const chip = sat ? `<span class="chip" style="--c:${sat.cor}">${esc(TIPOS[sat.tipo].nome)}</span>` : (cap.kicker ? `<span class="chip" style="--c:var(--foco)">${esc(cap.kicker)}</span>` : '');
      h += `<div class="eyebrow">${chip}<span>Cap. ${s.ci} · ${esc(s.rotulo)}${total > 1 ? ` · ${s.pi + 1}/${total}` : ''}</span></div>`;
      h += `<h2>${esc(s.h)}</h2><p>${s.p}</p>`;
      if (s.legenda) h += `<ul class="legenda">${Object.keys(TIPOS).map(k => `<li><i class="sw ${k}"></i><b>${esc(TIPOS[k].nome)}</b><span>${esc(TIPOS[k].desc)}: ${SID.filter(i => SATS[i].tipo === k).map(i => SATS[i].nome).join(', ')}</span></li>`).join('')}</ul>`;
      if (s.partes && cap.sat) h += `<ol class="partes">${PARTES[cap.sat].map((p, i) => `<li data-part="${i}"><b>${esc(p[0])}</b><span>${esc(p[1])}</span></li>`).join('')}</ol><button class="again" type="button" data-again>Repetir a abertura</button>`;
      if (s.fatos) h += `<dl class="fatos">${s.fatos.map(f => `<dt>${esc(f[0])}</dt><dd>${esc(f[1])}</dd>`).join('')}</dl>`;
      if (s.view === 'quiz') h += quizHTML();
      if (s.pergunta) h += `<div class="ask"><span>Pergunte à turma</span>${esc(s.pergunta)}</div>`;
      if (s.dica) h += `<p class="dica">${esc(s.dica)}</p>`;
    }
    card.innerHTML = h;
    card.scrollTop = 0;
    card.querySelectorAll('[data-part]').forEach(li => {
      li.addEventListener('mouseenter', () => { hoverPart = +li.dataset.part; });
      li.addEventListener('mouseleave', () => { hoverPart = -1; });
      li.addEventListener('focus', () => { hoverPart = +li.dataset.part; });
      li.tabIndex = 0;
    });
    const ag = card.querySelector('[data-again]'); if (ag) ag.addEventListener('click', playOpen);
    const nx = card.querySelector('[data-next]'); if (nx) nx.addEventListener('click', () => go(cur + 1));
    if (s.view === 'quiz') bindQuiz();
    card.classList.remove('in'); void card.offsetWidth; card.classList.add('in');
  }
  let hoverPart = -1;

  /* ---------- quiz ---------- */
  let qi = 0, qScore = 0, qAnswered = false;
  function quizHTML() {
    if (qi >= QUIZ.length) return `<div class="quiz"><p class="qfim">Você acertou <b>${qScore} de ${QUIZ.length}</b>.</p><button class="again" type="button" data-qreset>Recomeçar o desafio</button></div>`;
    const q = QUIZ[qi];
    return `<div class="quiz"><div class="qn">Situação ${qi + 1} de ${QUIZ.length}</div><p class="qq">${esc(q.q)}</p>
      <div class="qops">${q.op.map(o => `<button type="button" data-op="${o[0]}"><i style="background:${SATS[o[0]].cor}"></i>${esc(o[1])}</button>`).join('')}</div>
      <div class="qexp" hidden></div><button class="go" type="button" data-qnext hidden>${qi + 1 < QUIZ.length ? 'Próxima situação' : 'Ver resultado'}</button></div>`;
  }
  function bindQuiz() {
    qAnswered = false;
    card.querySelectorAll('[data-op]').forEach(b => b.addEventListener('click', () => {
      if (qAnswered) return; qAnswered = true;
      const q = QUIZ[qi], ok = b.dataset.op === q.certa; if (ok) qScore++;
      card.querySelectorAll('[data-op]').forEach(x => { x.disabled = true; if (x.dataset.op === q.certa) x.classList.add('ok'); });
      if (!ok) b.classList.add('no');
      const ex = card.querySelector('.qexp'); ex.hidden = false; ex.innerHTML = `<b>${ok ? 'Certo.' : 'Não é esse.'}</b> ${esc(q.exp)}`;
      card.querySelector('[data-qnext]').hidden = false;
    }));
    const n = card.querySelector('[data-qnext]'); if (n) n.addEventListener('click', () => { qi++; renderCard(STEPS[cur]); });
    const r = card.querySelector('[data-qreset]'); if (r) r.addEventListener('click', () => { qi = 0; qScore = 0; renderCard(STEPS[cur]); });
  }

  /* ---------- laboratório ---------- */
  const labEl = $('#lab'), labC = $('#labc'), labG = labC.getContext('2d'), labCtl = $('#labctl'), labTitle = $('#labtitle');
  let lab = null; const labStates = {};
  function openLab(s) {
    const type = s.view === 'fusao' ? 'fusao' : (s.fase === 'lab' && s.cap.sat ? SATS[s.cap.sat].lab : null);
    if (!type) { labEl.hidden = true; lab = null; return; }
    const sat = s.cap.sat || 'gedi';
    const key = type + ':' + sat;
    const L = LABS[type];
    let state = labStates[key];
    if (!state) { state = labStates[key] = L.padrao(sat); L.init(state, sat); }
    state.estagio = s.estagio || 0; state.restart = true;
    lab = { type, sat, L, state };
    labEl.hidden = false;
    labTitle.textContent = { lidar: 'Lidar de forma de onda', fotons: 'Contagem de fótons', optico: 'Imageamento multiespectral', radar: 'Radar de abertura sintética', fusao: 'Fusão GEDI + imagem' }[type];
    labCtl.innerHTML = L.controles(sat).map(c => `<div class="seg" role="group" aria-label="${esc(c.rotulo)}"><span>${esc(c.rotulo)}</span>${c.ops.map(o => `<button type="button" data-c="${c.id}" data-v="${o[0]}" aria-pressed="${state[c.id] === o[0]}">${esc(o[1])}</button>`).join('')}</div>`).join('');
    labCtl.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
      state[b.dataset.c] = b.dataset.v; L.init(state, sat);
      labCtl.querySelectorAll(`[data-c="${b.dataset.c}"]`).forEach(x => x.setAttribute('aria-pressed', x === b));
    }));
    sizeLab();
  }
  function sizeLab() {
    if (labEl.hidden) return;
    const r = labC.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2);
    labC.width = Math.round(r.width * d); labC.height = Math.round(r.height * d);
    labG.setTransform(d, 0, 0, d, 0, 0);
  }
  labC.addEventListener('mousemove', e => { if (!lab) return; const r = labC.getBoundingClientRect(); lab.state.hover = { x: e.clientX - r.left, y: e.clientY - r.top }; });
  labC.addEventListener('mouseleave', () => { if (lab) lab.state.hover = null; });

  /* ---------- navegação ---------- */
  function go(i) {
    i = clamp(i, 0, STEPS.length - 1); if (i === cur) return;
    cur = i; const s = STEPS[i];
    if (s.view === 'quiz' && s.cap.passos) { /* mantém o progresso */ }
    applyScene(s); renderCard(s); openLab(s); updatePill(); closeMenu();
    try { history.replaceState(null, '', '#' + s.cap.id); } catch (e) { }
  }
  function goCap(id) { const i = STEPS.findIndex(s => s.cap.id === id); if (i >= 0) go(i); }
  const pillT = $('#pilltitle'), pillD = $('#pilldots');
  function updatePill() {
    const s = STEPS[cur];
    pillT.textContent = s.cap.titulo;
    pillD.innerHTML = s.cap.passos.map((p, i) => `<i class="${i === s.pi ? 'on' : ''}" title="${esc(p.rotulo)}"></i>`).join('');
    $('#prev').disabled = cur === 0; $('#next').disabled = cur === STEPS.length - 1;
    $('#count').textContent = `${cur + 1}/${STEPS.length}`;
  }
  $('#prev').addEventListener('click', () => go(cur - 1));
  $('#next').addEventListener('click', () => go(cur + 1));
  addEventListener('keydown', e => {
    if (e.target.closest && e.target.closest('input,textarea')) return;
    if (['ArrowRight', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); go(cur + 1); }
    if (['ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); go(cur - 1); }
    if (e.key === 'Home') go(0);
    if (e.key === 'Escape') closeMenu();
    if (e.key.toLowerCase() === 'm') toggleMenu();
  });
  // menu de capítulos
  const menu = $('#menu');
  menu.querySelector('.grid').innerHTML = CAPS.map((c, i) => {
    const s = c.sat ? SATS[c.sat] : null;
    return `<button type="button" data-cap="${c.id}"><span class="n">${String(i).padStart(2, '0')}</span><span class="t"><b>${esc(c.titulo)}</b><small>${esc(s ? TIPOS[s.tipo].nome : (c.kicker || c.passos.length + ' passos'))}</small></span>${s ? `<i style="background:${s.cor}"></i>` : ''}</button>`;
  }).join('');
  menu.querySelectorAll('[data-cap]').forEach(b => b.addEventListener('click', () => goCap(b.dataset.cap)));
  function toggleMenu() { menu.hidden ? openMenu() : closeMenu(); }
  function openMenu() { menu.hidden = false; $('#menubtn').setAttribute('aria-expanded', 'true'); }
  function closeMenu() { menu.hidden = true; $('#menubtn').setAttribute('aria-expanded', 'false'); }
  $('#menubtn').addEventListener('click', toggleMenu);
  menu.addEventListener('click', e => { if (e.target === menu) closeMenu(); });
  $('#fs').addEventListener('click', () => {
    try { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen().catch(() => { }); } catch (e) { }
  });

  /* ---------- etiquetas das partes ---------- */
  const svg = $('#lines'), partEls = [];
  function ensurePartLabels() {
    const id = fSat; if (!id) return;
    if (partEls.id === id) return;
    partEls.forEach(p => { p.el.remove(); p.ln.remove(); }); partEls.length = 0; partEls.id = id;
    PARTES[id].forEach((p, i) => {
      const el = document.createElement('div'); el.className = 'plbl'; el.innerHTML = `<b>${i + 1}</b>${esc(p[0])}`;
      el.addEventListener('mouseenter', () => hoverPart = i); el.addEventListener('mouseleave', () => hoverPart = -1);
      labelsEl.appendChild(el);
      const ln = document.createElementNS('http://www.w3.org/2000/svg', 'polyline'); svg.appendChild(ln);
      const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle'); dot.setAttribute('r', 3); svg.appendChild(dot);
      partEls.push({ el, ln, dot });
    });
  }
  const tmpV = new T.Vector3();
  function toScreen(v) { tmpV.copy(v).project(camera); return { x: (tmpV.x + 1) / 2 * innerWidth, y: (1 - tmpV.y) / 2 * innerHeight, z: tmpV.z }; }
  let lastHi = -2;
  function updatePartLabels() {
    const s = STEPS[cur];
    const show = fSat && s.fase === 'abrir' && st.e > .45;
    if (!show) { partEls.forEach(p => { p.el.style.opacity = 0; p.ln.style.opacity = 0; p.dot.style.opacity = 0; }); if (lastHi !== -1 && model) { model.highlight(-1); lastHi = -1; } return; }
    ensurePartLabels();
    if (hoverPart !== lastHi) { model.highlight(hoverPart); lastHi = hoverPart; card.querySelectorAll('[data-part]').forEach(li => li.classList.toggle('hi', +li.dataset.part === hoverPart)); }
    const c = toScreen(focus.getWorldPosition(new T.Vector3()));
    const items = model.parts.map((p, i) => {
      const w = p.obj.getWorldPosition(new T.Vector3()); const a = toScreen(w);
      let dx = a.x - c.x, dy = a.y - c.y; const L = Math.hypot(dx, dy) || 1; dx /= L; dy /= L;
      if (L < 4) { dx = i % 2 ? 1 : -1; dy = 0; }
      return { i, a, x: a.x + dx * 70, y: a.y + dy * 50, side: dx >= 0 ? 1 : -1 };
    });
    // evita sobreposição vertical por lado
    [-1, 1].forEach(side => {
      const g = items.filter(o => o.side === side).sort((p, q) => p.y - q.y);
      for (let k = 1; k < g.length; k++) if (g[k].y - g[k - 1].y < 30) g[k].y = g[k - 1].y + 30;
    });
    const op = clamp((st.e - .45) / .3);
    items.forEach(o => {
      const P = partEls[o.i]; const hi = o.i === hoverPart;
      const w = P.el.offsetWidth;
      const lx = o.side > 0 ? o.x : o.x - w;
      P.el.style.transform = `translate(${lx}px, ${o.y - 12}px)`;
      P.el.style.opacity = op; P.el.classList.toggle('hi', hi);
      const ex = o.side > 0 ? o.x : o.x;
      P.ln.setAttribute('points', `${o.a.x},${o.a.y} ${ex},${o.y}`);
      P.ln.style.opacity = op; P.ln.classList.toggle('hi', hi);
      P.dot.setAttribute('cx', o.a.x); P.dot.setAttribute('cy', o.a.y); P.dot.style.opacity = op;
    });
  }
  // etiquetas de anotação (altitude, faixa)
  const ann = { alt: $('#annAlt'), sw: $('#annSw') };
  function updateAnnotations() {
    const s = STEPS[cur];
    const on = fSat && (s.fase === 'dado' || s.fase === 'encontro') && beams.userData.anchor && earthT >= 1;
    ann.alt.hidden = ann.sw.hidden = !on; if (!on) return;
    const A = beams.userData.anchor, S = SATS[fSat];
    const mid = A.P.clone().lerp(A.G, .55); const m = toScreen(mid);
    ann.alt.textContent = `${S.alt.toLocaleString('pt-BR')} km de altitude`;
    ann.alt.style.transform = `translate(${m.x + 12}px, ${m.y}px)`;
    const sw = toScreen(A.swathAt); ann.sw.textContent = S.swathTxt;
    ann.sw.style.transform = `translate(${sw.x + 10}px, ${sw.y - 10}px)`;
    ann.sw.style.visibility = sw.z < 1 ? 'visible' : 'hidden';
  }
  // rótulos dos satélites na visão geral
  function updateSatLabels() {
    const vis = fleet.visible;
    const camPos = camera.position;
    SID.forEach(id => {
      const o = SO[id];
      if (!vis) { o.lab.style.display = 'none'; return; }
      const p = o.dot.position; const r = new T.Ray(camPos.clone(), p.clone().sub(camPos).normalize());
      const hit = r.intersectSphere(new T.Sphere(new T.Vector3(), 1), new T.Vector3());
      const hidden = hit && camPos.distanceTo(hit) < camPos.distanceTo(p);
      const s = toScreen(p);
      o.lab.style.display = hidden || s.z > 1 ? 'none' : '';
      o.lab.style.transform = `translate(${s.x + 10}px, ${s.y - 10}px)`;
    });
  }

  /* ---------- laço ---------- */
  let last = performance.now(), clock = 0;
  function resize() {
    renderer.setSize(innerWidth, innerHeight, false);
    camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
    svg.setAttribute('viewBox', `0 0 ${innerWidth} ${innerHeight}`);
    sizeLab(); viewOffTo = computeViewOff();
  }
  addEventListener('resize', resize);
  function frame(now) {
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    tick(dt);
    requestAnimationFrame(frame);
  }
  function tick(dt) {
    clock += dt;
    runSeq(dt);
    // Terra
    if (fSat && earthTarget != null) {
      earthT = Math.min(1, earthT + dt / (REDUZ ? .01 : 2.2));
      earth.rotation.y = lerp(earthFrom, earthTarget, easeIO(earthT));
    } else if (!REDUZ) earth.rotation.y += dt * .025;
    // frota
    SID.forEach(id => { const o = SO[id], s = SATS[id]; o.u += o.w * dt * (REDUZ ? .2 : 1); o.dot.position.copy(orbitPos(s.inc, s.raan, o.u, o.r)); });
    // foco
    if (fSat) {
      const up = cerradoWorld(), B = basisAt(up);
      focus.position.copy(up).multiplyScalar(1 + SATS[fSat].alt * KM);
      focus.quaternion.copy(B.q);
      model.update(st.o, st.e, st.d);
      if (beams.userData.pulse) {
        const p = beams.userData.pulse, k = (clock * .8) % 1, { P, G } = p.userData;
        p.position.copy(P).lerp(G, k < .5 ? k * 2 : 2 - k * 2);
        p.material.opacity = k < .5 ? 1 : .5;
      }
      beams.visible = STEPS[cur].fase !== 'abrir' && earthT >= 1;
    }
    updateCam(dt);
    viewOff += (viewOffTo - viewOff) * Math.min(1, dt * 4);
    if (Math.abs(viewOff) > .5) camera.setViewOffset(innerWidth, innerHeight, viewOff, 0, innerWidth, innerHeight); else camera.clearViewOffset();
    renderer.render(scene, camera);
    updateSatLabels(); updatePartLabels(); updateAnnotations();
    if (lab) {
      const r = labC.getBoundingClientRect();
      lab.L.draw(labG, r.width, r.height, clock, lab.state, lab.sat);
    }
  }

  /* ---------- início ---------- */
  resize();
  const start = Q.has('s') ? +Q.get('s') : (() => { const h = (location.hash || '').slice(1); const i = STEPS.findIndex(s => s.cap.id === h); return i >= 0 ? i : 0; })();
  rig.target.set(0, 0, 0); rig.dist = 5; rig.yaw = -.4; rig.pitch = .1;
  go(start);
  setTimeout(() => { viewOffTo = computeViewOff(); }, 50);
  new MutationObserver(() => { viewOffTo = computeViewOff(); }).observe(labEl, { attributes: true, attributeFilter: ['hidden'] });
  const ro = new ResizeObserver(() => { viewOffTo = computeViewOff(); sizeLab(); }); ro.observe(card); ro.observe(labEl);
  if (Q.has('instant')) { viewOffTo = computeViewOff(); for (let i = 0; i < 90; i++) tick(.05); }
  requestAnimationFrame(frame);
  addEventListener('hashchange', () => { const h = location.hash.slice(1); const s = STEPS[cur]; if (s && s.cap.id !== h) goCap(h); });
})();
