/* =====================================================================
   Omar Elarabi portfolio: the entry room.
   A full-bleed still of Omar's study at night (rain on the window is live),
   four pinned objects with neon leader-line labels, and a hologram frame
   that takes the colour of the world you are about to enter. Hovering an
   object (or a list option) opens that world in a ripple that grows from
   the object until the whole room has changed; moving away closes it.
   window.GateRoom: new GateRoom(stage, {items, onHover, onPick})
                    .hover(id|null) · .select(id|null) · .frame(timeMs) · .dispose()
   ===================================================================== */
(function () {
  "use strict";
  const IMG = { src: "img/room/study.webp", w: 1280, h: 1024 };
  // object anchors in image pixels, and where each label sits relative to it (screen px: elbow dx, dy, then horizontal run)
  const SPOTS = {
    aero: { x: 1160, y: 78, r: 70, dx: -46, dy: 54, run: -120, side: "l" },
    structures: { x: 1172, y: 268, r: 52, dx: -48, dy: 46, run: -112, side: "l" },
    control: { x: 1222, y: 430, r: 60, dx: -34, dy: 92, run: -116, side: "l" },
    data: { x: 925, y: 545, r: 85, dx: -70, dy: 150, run: -120, side: "l" },
  };
  const WIN = { x0: 199, x1: 540, y0: 0, y1: 576 }; // window glass in image pixels
  const LAP = { x0: 838, x1: 1014, y0: 474, y1: 608 }; // laptop screen
  const LAMP = { x: 1036, y: 428 };
  const NEUTRAL = "#8fb8ff";
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  class GateRoom {
    constructor(stage, opt) {
      this.stage = stage; this.opt = opt; this.items = opt.items; this.hot = null; this.sel = null; this.mx = 0; this.my = 0; this.pmx = 0; this.pmy = 0;
      this.col = hexRgb(NEUTRAL); this.colT = hexRgb(NEUTRAL); this.flash = 0; this.nextFlash = 4; this.reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
      stage.innerHTML = `
        <div class="gr-ext" style="background-image:url(${IMG.src})"></div><div class="gr-scene"><img class="gr-img" src="${IMG.src}" alt="Omar at his desk at night, typing on a laptop, with London in the rain outside the window, his graduation gown on a stand and models of his projects on the shelves" decoding="async"><canvas class="gr-rain"></canvas><i class="gr-lap"></i><i class="gr-lamp"></i></div>
        <i class="gr-flash"></i>
        ${this.items.map((t) => `<div class="gr-rev" data-g="${t.id}" style="background-image:url(img/room/${t.id}.webp)"></div>`).join("")}
        <canvas class="gr-holo"></canvas>
        <svg class="gr-lines" aria-hidden="true"></svg>
        <div class="gr-labels">${this.items.map((t) => `<button type="button" class="gr-lab" data-g="${t.id}" style="--c:${t.color}" aria-label="Open ${t.name}"><span class="gr-t">${t.name}</span><span class="gr-s">${t.sub}</span></button>`).join("")}</div>
        <div class="gr-hots">${this.items.map((t) => `<button type="button" class="gr-hot" data-g="${t.id}" style="--c:${t.color}" aria-label="${t.name}"><i></i></button>`).join("")}</div>`;
      const q = (s) => stage.querySelector(s);
      this.scene = q(".gr-scene"); this.img = q(".gr-img"); this.rainCv = q(".gr-rain"); this.lap = q(".gr-lap"); this.lamp = q(".gr-lamp"); this.flashEl = q(".gr-flash");
      this.holo = q(".gr-holo"); this.svg = q(".gr-lines"); this.revs = {}; stage.querySelectorAll(".gr-rev").forEach((r) => (this.revs[r.dataset.g] = r));
      this.labs = {}; stage.querySelectorAll(".gr-lab").forEach((l) => (this.labs[l.dataset.g] = l)); this.hots = {}; stage.querySelectorAll(".gr-hot").forEach((h) => (this.hots[h.dataset.g] = h));
      this.colorOf = Object.fromEntries(this.items.map((t) => [t.id, t.color]));
      // pointer: hover opens a world, leaving closes it, click picks it
      const over = (e) => { const b = e.target.closest(".gr-hot, .gr-lab"); if (b) this.setHot(b.dataset.g, true); };
      const out = (e) => { const b = e.target.closest(".gr-hot, .gr-lab"); if (!b) return; const to = e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest(".gr-hot, .gr-lab"); if (!to || to.dataset.g !== b.dataset.g) this.setHot(null, true); };
      stage.addEventListener("pointerover", over); stage.addEventListener("pointerout", out);
      stage.addEventListener("click", (e) => { const b = e.target.closest(".gr-hot, .gr-lab"); if (b) opt.onPick && opt.onPick(b.dataset.g); });
      this._mv = (e) => { this.mx = (e.clientX / innerWidth) * 2 - 1; this.my = (e.clientY / innerHeight) * 2 - 1; };
      addEventListener("pointermove", this._mv, { passive: true });
      this._rs = () => this.layout(); addEventListener("resize", this._rs);
      this.drops = Array.from({ length: 160 }, () => this.newDrop(true)); this.streaks = Array.from({ length: 140 }, () => [Math.random(), Math.random(), 0.6 + Math.random() * 0.8]);
      if (this.img.complete) this.layout(); else this.img.addEventListener("load", () => this.layout(), { once: true });
      this.layout();
    }
    newDrop(any) { return { x: Math.random(), y: any ? Math.random() : -0.05, r: 0.8 + Math.random() * 2.6, v: 0, tr: [] }; }
    // fit the image to cover the stage; keep the shelf at the top and the desk on screen
    layout() {
      const W = this.stage.clientWidth || innerWidth, H = this.stage.clientHeight || innerHeight, wide = W > 900;
      // desktop: the whole room (gown, window, desk, shelves) sits to the right of the text, with a blurred extension behind the text
      const s = wide ? Math.max(H / IMG.h, (W * 0.8) / IMG.w) * 1.02 : Math.max(W / IMG.w, (H * 0.6) / IMG.h) * 1.02;
      const sw = IMG.w * s, sh = IMG.h * s;
      const left = wide ? W - sw + 0.01 * sw : clamp(W / 2 - 0.7 * sw, W - sw, 0), top = wide ? clamp(-0.015 * sh, H - sh, 0) : 0;
      Object.assign(this, { W, H, s, sw, sh, left, top, wide });
      Object.assign(this.scene.style, { width: sw + "px", height: sh + "px", left: left + "px", top: top + "px" });
      const box = (el, b) => Object.assign(el.style, { left: (b.x0 / IMG.w) * 100 + "%", top: (b.y0 / IMG.h) * 100 + "%", width: ((b.x1 - b.x0) / IMG.w) * 100 + "%", height: ((b.y1 - b.y0) / IMG.h) * 100 + "%" });
      box(this.rainCv, WIN); box(this.lap, LAP); Object.assign(this.lamp.style, { left: (LAMP.x / IMG.w) * 100 + "%", top: (LAMP.y / IMG.h) * 100 + "%" });
      const dpr = Math.min(2, devicePixelRatio || 1), rw = ((WIN.x1 - WIN.x0) / IMG.w) * sw, rh = ((WIN.y1 - WIN.y0) / IMG.h) * sh;
      this.rainCv.width = Math.round(rw * dpr); this.rainCv.height = Math.round(rh * dpr); this.rdpr = dpr;
      this.holo.width = Math.round(W * Math.min(1.5, dpr)); this.holo.height = Math.round(H * Math.min(1.5, dpr)); this.hdpr = Math.min(1.5, dpr);
      this.svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    }
    pt(id) { const p = SPOTS[id], k = 1.025, ox = this.pmx * 10, oy = this.pmy * 6; const cx = this.left + this.sw / 2, cy = this.top + this.sh / 2; return { x: cx + (this.left + p.x * this.s - cx) * k + ox, y: cy + (this.top + p.y * this.s - cy) * k + oy }; }
    setHot(id, fromRoom) { if (id === this.hot) return; this.hot = id; this.paint(); if (fromRoom && this.opt.onHover) this.opt.onHover(id); }
    hover(id) { if (id === this.hot) return; this.hot = id; this.paint(); }
    select(id) { this.sel = id; this.paint(); }
    paint() {
      const show = this.hot || this.sel;
      this.items.forEach((t) => {
        const r = this.revs[t.id], on = t.id === show, p = this.pt(t.id);
        r.style.setProperty("--x", p.x + "px"); r.style.setProperty("--y", p.y + "px");
        r.classList.toggle("on", on); if (on) r.style.zIndex = String(++this.z || (this.z = 5));
        this.labs[t.id].classList.toggle("hot", t.id === show); this.hots[t.id].classList.toggle("hot", t.id === show);
      });
      this.stage.classList.toggle("gr-open", !!show); this.stage.classList.toggle("gr-sel", !!this.sel);
      this.colT = hexRgb(show ? this.colorOf[show] : NEUTRAL);
    }
    frame(ms) {
      const t = ms / 1000; this.pmx += (this.mx - this.pmx) * 0.05; this.pmy += (this.my - this.pmy) * 0.05;
      const ox = this.pmx * 10, oy = this.pmy * 6; this.scene.style.transform = `translate(${ox}px, ${oy}px) scale(1.025)`;
      this.col = this.col.map((c, i) => c + (this.colT[i] - c) * 0.08);
      this.place(t); if (!this.hot && !this.sel) this.rain(t); this.holoDraw(t);
      // lamp breathes, laptop screen flickers as he types
      this.lap.style.opacity = (0.55 + 0.25 * Math.max(0, Math.sin(t * 9.7)) * Math.max(0, Math.sin(t * 1.3)) + 0.08 * Math.sin(t * 31)).toFixed(3);
      this.lamp.style.opacity = (0.75 + 0.06 * Math.sin(t * 2.1) + 0.03 * Math.sin(t * 13)).toFixed(3);
    }
    // leader lines + labels follow the parallax
    place(t) {
      let d = ""; const W = this.W, H = this.H; const widths = Object.fromEntries(this.items.map((it) => [it.id, this.labs[it.id].offsetWidth || 160]));
      this.items.forEach((it) => {
        const sp = SPOTS[it.id], p = this.pt(it.id), hot = this.hots[it.id], lab = this.labs[it.id];
        const r = sp.r * this.s; hot.style.transform = `translate(${(p.x - r).toFixed(1)}px, ${(p.y - r).toFixed(1)}px)`; hot.style.width = hot.style.height = 2 * r + "px";
        const m = this.wide ? 1 : 0.55, e = { x: p.x + sp.dx * m, y: p.y + sp.dy * m }, lw = widths[it.id], end = { x: clamp(e.x + sp.run * m, lw + 12, W - 12), y: clamp(e.y, 30, H - 30) };
        d += `<g class="gr-ln${it.id === (this.hot || this.sel) ? " hot" : ""}" style="--c:${it.color}"><circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="3.5"/><polyline points="${p.x.toFixed(1)},${p.y.toFixed(1)} ${e.x.toFixed(1)},${end.y.toFixed(1)} ${end.x.toFixed(1)},${end.y.toFixed(1)}"/></g>`;
        lab.style.transform = `translate(${(end.x - lw - 8).toFixed(1)}px, ${(end.y - 24).toFixed(1)}px)`;
      });
      this.svg.innerHTML = d;
    }
    // rain outside and on the glass, with the odd flash of lightning
    rain(t) {
      const c = this.rainCv.getContext("2d"), w = this.rainCv.width, h = this.rainCv.height, k = this.rdpr; if (!w || !h) return;
      const dt = Math.min(0.05, t - (this.lt || t)); this.lt = t; c.clearRect(0, 0, w, h);
      if (!this.reduced) {
        c.strokeStyle = "rgba(190,210,255,.28)"; c.lineWidth = 1 * k; c.beginPath();
        this.streaks.forEach((s) => { const y = ((s[1] + t * 0.9 * s[2]) % 1.1) * h - 0.05 * h, x = ((s[0] + t * 0.02 * s[2]) % 1) * w; c.moveTo(x, y); c.lineTo(x - 3 * k, y + 22 * k * s[2]); }); c.stroke();
      }
      this.drops.forEach((d, i) => {
        if (!this.reduced) { if (d.r > 2.2 && Math.random() < 0.004) d.v = 0.05 + Math.random() * 0.15; d.y += d.v * dt; d.v *= 0.995; if (d.v > 0.01) { d.tr.push([d.x, d.y]); if (d.tr.length > 18) d.tr.shift(); } }
        if (d.y > 1.05) this.drops[i] = this.newDrop(false);
        const x = d.x * w, y = d.y * h, r = d.r * k;
        if (d.tr.length > 1) { c.strokeStyle = "rgba(200,220,255,.10)"; c.lineWidth = r * 0.9; c.beginPath(); d.tr.forEach(([a, b], j) => (j ? c.lineTo(a * w, b * h) : c.moveTo(a * w, b * h))); c.stroke(); }
        const g = c.createRadialGradient(x - r * 0.3, y - r * 0.35, 0, x, y, r); g.addColorStop(0, "rgba(255,255,255,.55)"); g.addColorStop(0.55, "rgba(170,195,240,.16)"); g.addColorStop(1, "rgba(110,130,190,.32)");
        c.fillStyle = g; c.beginPath(); c.ellipse(x, y, r * 0.85, r, 0, 0, 6.283); c.fill();
      });
      if (!this.reduced && t > this.nextFlash) { this.flashT = t; this.nextFlash = t + 8 + Math.random() * 9; }
      const fe = this.flashT != null ? t - this.flashT : 9, fl = Math.max(0, Math.exp(-fe * 9) + (fe > 0.16 ? 0.7 * Math.exp(-(fe - 0.16) * 7) : 0));
      if (fl > 0.01) { c.fillStyle = `rgba(215,228,255,${(fl * 0.45).toFixed(3)})`; c.fillRect(0, 0, w, h); }
      this.flashEl.style.opacity = (fl * 0.18).toFixed(3);
    }
    // hologram frame: edge glow, scan band, corner brackets, drifting grid and motes in the theme colour
    holoDraw(t) {
      const c = this.holo.getContext("2d"), k = this.hdpr, W = this.holo.width, H = this.holo.height, [r, g, b] = this.col.map(Math.round), C = (a) => `rgba(${r},${g},${b},${a})`;
      c.clearRect(0, 0, W, H); const open = this.hot || this.sel ? 1 : 0.6;
      // edge glow
      [[0, 0, W, 0, 0, 1], [0, H, W, H, 0, -1]].forEach(([x0, y0, x1, y1, , s]) => { const gr = c.createLinearGradient(0, y0, 0, y0 + s * 90 * k); gr.addColorStop(0, C(0.32 * open)); gr.addColorStop(1, C(0)); c.fillStyle = gr; c.fillRect(0, s > 0 ? 0 : H - 90 * k, W, 90 * k); });
      [[0, 1], [W, -1]].forEach(([x0, s]) => { const gr = c.createLinearGradient(x0, 0, x0 + s * 120 * k, 0); gr.addColorStop(0, C(0.28 * open)); gr.addColorStop(1, C(0)); c.fillStyle = gr; c.fillRect(s > 0 ? 0 : W - 120 * k, 0, 120 * k, H); });
      // perspective grid creeping in from the floor edge and the right wall
      c.strokeStyle = C(0.13 * open); c.lineWidth = 1 * k; c.beginPath();
      const hy = H * 0.86, vx = W * 0.6;
      for (let i = -12; i <= 12; i++) { c.moveTo(vx + i * 40 * k, hy); c.lineTo(vx + i * 260 * k, H); }
      for (let j = 0; j < 6; j++) { const y = hy + Math.pow((j + ((t * 0.25) % 1)) / 6, 2) * (H - hy); c.moveTo(0, y); c.lineTo(W, y); }
      c.stroke();
      // scan band sweeping down
      const sy = ((t * 0.08) % 1.2) * H - 0.1 * H, sg = c.createLinearGradient(0, sy - 40 * k, 0, sy + 40 * k); sg.addColorStop(0, C(0)); sg.addColorStop(0.5, C(0.09 * open)); sg.addColorStop(1, C(0)); c.fillStyle = sg; c.fillRect(0, sy - 40 * k, W, 80 * k);
      // corner brackets
      c.strokeStyle = C(0.75 * open); c.lineWidth = 1.5 * k; const m = 18 * k, L = 34 * k;
      [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]].forEach(([x, y, sx, sy2]) => { c.beginPath(); c.moveTo(x, y + sy2 * L); c.lineTo(x, y); c.lineTo(x + sx * L, y); c.stroke(); });
      // motes
      c.fillStyle = C(0.55 * open);
      for (let i = 0; i < 46; i++) { const x = ((i * 0.6180339 + t * 0.006 * (1 + (i % 5))) % 1) * W, y = (1 - ((i * 0.37 + t * 0.012 * (1 + (i % 3))) % 1)) * H, s = (1 + (i % 3)) * k; if (x > W * 0.35 || i % 4 === 0) c.fillRect(x, y, s, s); }
    }
    dispose() { removeEventListener("pointermove", this._mv); removeEventListener("resize", this._rs); this.stage.innerHTML = ""; }
  }
  function hexRgb(h) { h = h.replace("#", ""); if (h.length === 3) h = [...h].map((c) => c + c).join(""); const n = parseInt(h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  window.GateRoom = GateRoom;
})();
