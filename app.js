/* =====================================================================
   Omar Elarabi — portfolio v3. Loader and discipline gate, themed render
   from data.js, pinned scroll scenes, 3D hero, case-study dossiers.
   ===================================================================== */
(function () {
  "use strict";
  const D = window.PORTFOLIO, P = D.person;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const smooth = (t) => t * t * (3 - 2 * t);
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let paused = false;
  const ICON = {
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14M6 13l6 6 6-6"/></svg>',
    ext: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg>',
    cap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 10 12 5 2 10l10 5 10-5z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/></svg>',
    brief: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
    check: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 5 5L20 7"/></svg>',
    in: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" width="18" height="18"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V21h-4v-5.4c0-1.3-.02-2.95-1.8-2.95-1.8 0-2.07 1.4-2.07 2.86V21H9z"/></svg>',
  };
  const HEX = (cls) => `<svg ${cls ? `class="${cls}"` : ""} viewBox="0 0 32 32" aria-hidden="true"><path d="M16 2 L28 9 L28 23 L16 30 L4 23 L4 9 Z" fill="none" stroke="currentColor" stroke-width="1.5"/><text x="16" y="21" text-anchor="middle" font-size="14" font-weight="600" fill="currentColor" font-family="Montserrat, sans-serif">OE</text></svg>`;
  const proj = (id) => D.projects.find((p) => p.id === id);
  const EX = proj("exhaust");
  const TH = D.themes, thm = (id) => TH.find((t) => t.id === id) || TH[0];
  // gate and curtain palettes (dark variants of the four original presets, plus the light pages)
  const PAL = {
    structures: { l: ["#f7f7fc", "#4f46e5"], d: ["#0c0b1d", "#8b83ff"] },
    aero: { l: ["#f3f8ff", "#0077b6"], d: ["#020c1b", "#00d4ff"] },
    control: { l: ["#fffaf5", "#c2410c"], d: ["#150d07", "#fb923c"] },
    data: { l: ["#f0fdf4", "#059669"], d: ["#03140d", "#34d399"] },
  };
  const hex3 = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);

  /* ---------- academic stats ---------- */
  const E = D.education;
  const credC = E.years.flatMap((y) => y.courses).filter((c) => c[5] > 0);
  const avgMark = credC.reduce((a, c) => a + c[3], 0) / credC.length;
  const aCount = credC.filter((c) => c[4] === "A").length;
  const totalCred = E.years.reduce((a, y) => a + y.credits, 0);

  /* ---------- state ---------- */
  const root = document.documentElement, mq = window.matchMedia("(prefers-color-scheme: dark)");
  let disc = "structures", hadSaved = false;
  try { const s = localStorage.getItem("oe-disc"); if (TH.some((t) => t.id === s)) { disc = s; hadSaved = true; } } catch (e) {}
  try { const t = localStorage.getItem("oe-theme"); if (t === "light" || t === "dark") root.dataset.theme = t; } catch (e) {}
  root.dataset.disc = disc;
  const isDark = () => (root.dataset.theme ? root.dataset.theme === "dark" : mq.matches);
  let T = thm(disc);
  const cvOf = (t) => P.cvs[t.cv];

  /* ---------- static data for scenes ---------- */
  const steps = [
    { k: "01 · Architecture", t: "4-2-1, not 4-1.", p: "Pairing the primaries before the collector separates exhaust pulses, improving scavenging and lifting midrange torque, where a Formula Student car spends most of a lap.", big: "4-2-1", spots: [] },
    { k: "02 · Engine", t: "Built around the CBR600RR.", p: "599 cc inline-four, firing order 1-2-4-3, simulated at 8,000 rpm. Engine outlet and mounts fixed the starting geometry.", big: "8,000 rpm", spots: [0] },
    { k: "03 · Runners", t: "Theory, then packaging.", p: "Bell and Smith equations gave 517–700 mm. 1D simulation in MATLAB, Simulink and OpenWAM, then packaging under the chassis, settled a feasible 475–600 mm.", big: "475–600 mm", spots: [1, 2] },
    { k: "04 · CFD", t: "Checked in ANSYS Fluent.", p: "Pressure, velocity and temperature fields compared for the 4-2-1 against the 4-1 candidate, with mesh independence confirmed beyond about 2.0M elements.", big: "<2% Δ", spots: [3] },
    { k: "05 · Muffler & material", t: "Quiet, compact, durable.", p: "A compact hybrid muffler with basalt rock wool packing, and AISI 304 stainless for strength, weldability, cost and supply.", big: "AISI 304", spots: [4, 5] },
  ];
  const spots = [[74, 55, "Engine outlet"], [71, 77, "Primary runners"], [53, 90, "Packaging clearance"], [31, 83, "Secondary collector"], [20, 71, "Hybrid muffler"], [6, 50, "Exhaust outlet"]];
  const MUF = [
    ["Stage 1 · Straight-through", "straight", [["Benefit", "Lowest backpressure"], ["Limitation", "Insufficient attenuation"], ["Verdict", "Fails IMechE noise limits"]]],
    ["Stage 3 · Commercial hybrid", "commercial", [["Purpose", "Benchmark design"], ["Strength", "Proven acoustic geometry"], ["Limitation", "Off-the-shelf packaging"]]],
    ["Stage 4 · Compact hybrid", "final", [["Architecture", "Absorption + reflection chambers"], ["Packing", "Basalt rock wool"], ["Target", "IMechE static & dynamic noise"]]],
  ];
  const cfdTabs = EX.dossier.find((s) => s.id === "cfd").blocks.find((b) => b.type === "compare").tabs;
  const EXP_ORDER = ["pass-organiser", "hs-briefings", "hs-officer", "events-officer", "pass-mentor", "hyperlink-braking", "course-rep"];
  const LVW = { Introduced: 33, Beginner: 33, Proficient: 66, Intermediate: 66, Advanced: 83, "Highly Advanced": 91.5, Expert: 100, Native: 100 };
  const toolsAdv = D.skills.filter((c) => !c.lang).flatMap((c) => c.items).filter((s) => !/General/.test(s[0]) && LVW[s[1]] >= 83).length;
  const RAIL = [["top", "Intro"], ["about", "About"], ["principles", "Principles"], ["work", "Powertrain"], ["projects", "Projects"], ["involvement", "Involvement"], ["experience", "Path"], ["skills", "Skills"], ["cv", "CV"], ["contact", "Contact"]];

  /* =================== RENDER =================== */
  const main = $("#main");
  const label = (n, t) => `<p class="label"><b>${n}</b> · ${t}</p>`;

  function render() {
    T = thm(disc);
    const cv = cvOf(T);
    let h = "";

    /* ---- hero ---- */
    h += `
    <section class="hero" id="top" aria-label="Introduction"><div class="pin">
      <div class="copy">
        <p class="label">Aerospace Engineering Portfolio</p>
        <h1>Omar<br>Elarabi</h1>
        <p class="tag">${esc(P.tagline)}</p>
        <div class="btns"><a class="btn solid" href="#work" data-jump="work">View Projects ${ICON.arrow}</a><a class="btn" href="${cv[1]}" download>Download CV ${ICON.down}</a></div>
        <div class="meta"><span class="otw"><span class="beep"><i></i></span>Open to Work 2026</span><span class="viewing">Viewing as <b>${esc(T.name)}</b> · <button type="button" data-menu style="background:none;border:0;padding:0;color:var(--acc);cursor:pointer;font:inherit;text-decoration:underline;text-underline-offset:3px">change</button></span></div>
      </div>
      <div class="hstage">
        <svg class="corner tl" viewBox="0 0 90 90" fill="none" stroke="currentColor" stroke-width="1"><path d="M0 30V0h30M0 12h6M12 0v6"/></svg>
        <svg class="corner br" viewBox="0 0 90 90" fill="none" stroke="currentColor" stroke-width="1"><path d="M0 30V0h30M0 12h6M12 0v6"/></svg>
        ${T.id === "data" ? '<canvas class="code" id="hcode" aria-hidden="true"></canvas>' : ""}<canvas id="hcv" aria-hidden="true"></canvas>
        <svg class="callouts" id="callouts" aria-hidden="true"></svg>
        <div class="hint" id="hhint">${esc(T.hint)}</div>
      </div>
    </div></section>`;

    /* ---- moving keyword band, right above About ---- */
    const KW = ["Propulsion", "Formula Student", "CFD", "FEA", "Composites", "Control systems", "Energy systems", "Data science", "Sustainability", "Aerodynamics", "Simulation"];
    h += `<div class="ticker band" aria-hidden="true"><div>${[0, 1].map(() => KW.map((k) => `<span>${k}</span><i>/</i>`).join("")).join("")}</div></div>`;

    /* ---- about (original layout) ---- */
    const A = D.about;
    h += `
    <section class="sec" id="about" aria-labelledby="about-h"><div class="grid-bg"></div><div class="wrap about">
      <div class="rv pre">
        <div class="photo"><i class="a"></i><i class="b"></i><i class="c"></i><i class="d"></i><img src="img/headshot.webp" alt="Portrait of Omar Elarabi" loading="lazy"></div>
        <div class="grad"><span class="tick">${ICON.check}</span><div><b>${esc(P.honours)}</b><small>${esc(P.degree)} · ${esc(P.graduation)}</small></div></div>
        <div class="meta-rows">
          <div><span>Location</span><span class="dots"></span><span>${esc(P.location)}</span></div>
          <div><span>Graduation</span><span class="dots"></span><span>${esc(P.graduation)}</span></div>
          <div><span>Status</span><span class="dots"></span><span>${esc(P.status)}</span></div>
        </div>
        <div class="focus-tags"><p class="label" style="margin-bottom:14px">Career Focus</p><div class="t">${A.focusAreas.map((f) => `<span>${esc(f)}</span>`).join("")}</div></div>
      </div>
      <div class="about-body">
        <div class="idx">01</div>
        <h2 id="about-h" class="rv pre">About</h2>
        <p class="lead rv pre">${esc(A.focusHeadline)}</p>
        ${A.paragraphs.map((p) => `<p class="rv pre">${p}</p>`).join("")}
        <div class="seek rv pre"><p>${esc(A.seeking)}</p><span class="otw"><span class="beep"><i></i></span>Open to Work 2026</span></div>
      </div>
    </div></section>`;

    /* ---- slogan ---- */
    const lines = [["Better", "with", "every", "*iteration."], ["Sustainable", "and", "*compatible."], ["Structurally", "*sound."], ["Measured", "with", "*precision."]];
    h += `
    <section class="slogan" id="slogan" aria-label="Approach"><div class="pin"><div class="wrap">
      ${label("02", "Approach")}
      <h2 style="margin:0">${lines.map((l) => `<span class="line">${l.map((w) => `<span class="w${w[0] === "*" ? " hot" : ""}">${esc(w.replace("*", ""))}</span>`).join(" ")}</span>`).join("")}</h2>
      <p class="sub">Every design is treated as a loop, not a finish line: find what limits it, try a better way, then measure whether it really is better. Each pass has to stay sustainable, fit the wider system it belongs to and remain structurally sound, so every improvement is proven rather than assumed.</p>
    </div></div></section>`;

    /* ---- numbers ---- */
    const NUMS = [
      ["1st", "First Class Honours, BEng Aerospace Engineering, Queen Mary University of London", "Degree", true],
      ["40%", "increase in PASS student participation as Student Organiser", "Leadership"],
      [T.stat[0], T.stat[1], T.short, true],
      [String(toolsAdv), "engineering software tools at Advanced level or higher", "Software"],
      ["470+", "students reached during PASS Welcome Week outreach", "Outreach"],
      ["4,327", "materials screened in ANSYS EduPack for the A320 flap track fairing", "Materials"],
    ];
    h += `
    <section class="sec" id="numbers" aria-label="In numbers" style="border-top:0;padding-top:20px"><div class="wrap">
      ${label("03", "In numbers")}
      <div class="nums">${NUMS.map((n) => `<div class="rv pre"><small>${esc(n[2])}</small><b class="${n[3] ? "acc" : ""}" data-count="${esc(n[0])}">${esc(n[0])}</b><span>${esc(n[1])}</span></div>`).join("")}</div>
    </div></section>`;

    /* ---- principles (original two-column) ---- */
    const col = (title, items) => `<div><h3 class="label" style="margin-bottom:30px">${title}</h3>${items.map((it, i) => `<div class="item rv pre"><div class="h"><span>${String(i + 1).padStart(2, "0")}</span><h4>${esc(it.t)}</h4></div><p>${esc(it.d)}</p></div>`).join("")}</div>`;
    h += `
    <section class="sec" id="principles" aria-label="Engineering principles and team dynamics"><div class="wrap">
      ${label("04", "Design priorities")}
      <div class="prin">${col("Engineering Principles", A.principles)}${col("Team Dynamics", A.team)}</div>
    </div></section>`;

    /* ---- featured exhaust (inverse palette) ---- */
    h += `
    <section class="feat" id="work" aria-labelledby="ex-h">
      <div class="wrap intro">
        <p class="label"><b>05 · Featured</b> · Final-year project · ${esc(EX.descriptor.split("·")[0].trim())}</p>
        <h2 id="ex-h" class="rv pre">Powertrain<br><em>exhaust</em> system.</h2>
        <div class="cols"><p class="rv pre">${esc(EX.summary)}</p><div class="btns rv pre"><a class="btn solid" href="#exhaust" data-open="exhaust">Full case study ${ICON.arrow}</a></div></div>
      </div>
      <div class="reveal" id="reveal"><div class="pin"><div class="glow" id="rglow"></div>
        <div class="rsteps">${steps.map((s, i) => `<div class="step${i ? "" : " on"}"><small>${s.k}</small><h3>${s.t}</h3><p>${s.p}</p><span class="big">${s.big}</span></div>`).join("")}</div>
        <div class="rstage"><div style="position:relative;width:min(100%,980px)"><img id="rimg" src="img/exhaust-assembly.webp" alt="Final exhaust assembly packaged in the Formula Student chassis">${spots.map((s, i) => `<div class="hs${s[0] > 45 ? " l" : ""}" style="left:${s[0]}%;top:${s[1]}%"><i></i><span>${s[2]}</span></div>`).join("")}</div></div>
        <div class="dots">${steps.map((_, i) => `<i class="${i ? "" : "on"}"></i>`).join("")}</div>
      </div></div>
      <div class="muf" id="muf"><div class="pin wrap">
        <div class="top"><div><p class="label"><b>Muffler iterations</b> · shell and cut-away</p><h3 id="muf-t">${MUF[0][0]}</h3></div><div class="chips">${MUF.map((m, i) => `<span class="${i ? "" : "on"}">${m[0].split("·")[1].trim()}</span>`).join("")}</div></div>
        <div class="pairs">
          <figure><figcaption>Outer shell</figcaption>${MUF.map((m, i) => `<img class="${i ? "" : "on"}" src="img/muf-${m[1]}-shell.webp" alt="${esc(m[0])}: outer shell" loading="lazy">`).join("")}</figure>
          <figure><figcaption>Cut-away · internals</figcaption>${MUF.map((m, i) => `<img class="${i ? "" : "on"}" src="img/muf-${m[1]}-xray.webp" alt="${esc(m[0])}: internal structure" loading="lazy">`).join("")}</figure>
        </div>
        <div class="kv" id="muf-kv">${MUF[0][2].map((k) => `<div><span>${k[0]}</span><b>${k[1]}</b></div>`).join("")}</div>
        <p style="color:var(--ink-2);font-size:14.5px;max-width:80ch;margin:0">Straight-through had the lowest backpressure but failed the noise limits. A chambered design (stage 2) added attenuation at the cost of weight and backpressure. A commercial hybrid set the benchmark, and the final compact hybrid fits the chassis envelope.</p>
      </div></div>
      <div class="wrap cfdcmp">
        <p class="label"><b>CFD validation</b> · ANSYS Fluent · 8,000 rpm</p>
        <h3 class="rv pre">4-2-1 against the 4-1 candidate, field by field.</h3>
        <div class="tabsr" role="tablist">${cfdTabs.map((t, i) => `<button role="tab" aria-selected="${!i}" data-cfd="${i}">${esc(t.label)}</button>`).join("")}</div>
        ${cfdTabs.map((t, i) => `<div class="cfdp" ${i ? "hidden" : ""}><div class="pair"><figure class="sel"><img src="${t.a[0]}" alt="${esc(t.a[1])}" data-zoom loading="lazy"><figcaption>4-2-1 · selected</figcaption></figure><figure><img src="${t.b[0]}" alt="${esc(t.b[1])}" data-zoom loading="lazy"><figcaption>4-1 · candidate</figcaption></figure></div><p class="note">${esc(t.text)}</p></div>`).join("")}
        <div class="end"><div class="fs"><div><b>599 cc</b><span>Honda CBR600RR</span></div><div><b>4-2-1</b><span>selected layout</span></div><div><b>AISI 304</b><span>stainless steel</span></div></div><a class="btn solid" href="#exhaust" data-open="exhaust">Open the full case study ${ICON.arrow}</a></div>
      </div>
    </section>`;

    /* ---- gallery, ordered by discipline ---- */
    const others = T.order.map(proj).filter(Boolean);
    h += `
    <section id="projects" aria-labelledby="more-h">
      <div class="wrap gal-head">${label("06", `More work · ordered for ${esc(T.short)}`)}<h2 class="rv pre" id="more-h">Five more problems,<br>worked through.</h2></div>
      <div class="gallery-h" id="gal"><div class="pin"><div class="track" id="track">
        ${others.map((p, i) => `<article class="pcard" data-open="${p.id}" tabindex="0" role="link" aria-label="Open case study: ${esc(p.title)}">
          <div class="vis"><img src="${p.hdr}" alt="" loading="lazy"><span class="cat">${esc(p.kicker.split("·")[0].trim())}</span></div>
          <div class="txt"><div class="num"><b>${String(i + 2).padStart(2, "0")}</b> / 06</div><h3>${esc(p.title)}</h3><div class="d">${esc(p.descriptor.split("·")[0].trim())}</div><p>${esc(p.summary)}</p>
            <div class="ps">${p.stats.slice(0, 2).map((s) => `<div><b>${esc(s[1])}</b><span>${esc(s[0])}</span></div>`).join("")}</div>
            <span class="btn" style="align-self:flex-start">Open case study ${ICON.arrow}</span></div>
        </article>`).join("")}
      </div><div class="gal-count"><span id="gal-n">02</span><span class="bar"><i id="gal-bar"></i></span><span>06</span></div></div></div>
    </section>`;

    /* ---- getting involved (original) ---- */
    h += `
    <section class="sec" id="involvement" aria-labelledby="inv-h"><div class="wrap inv-wrap">
      <svg class="gear" id="gear" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="${gearPath()}"/><circle cx="50" cy="50" r="14"/></svg>
      <div class="inv-head" style="padding-left:clamp(0px,7vw,100px)">${label("07", "Contribution")}<h2 class="rv pre" id="inv-h">Getting Involved</h2><p class="rv pre">Beyond the degree: peer learning, outreach and support at Queen Mary University of London.</p></div>
      <div class="inv-grid">${D.involvement.map((c, i) => `<article class="inv rv pre"><div class="im"><img src="${c.img}" alt="${esc(c.alt)}" loading="lazy"><span>0${i + 1}</span></div><div class="b"><small>Getting involved</small><h3>${esc(c.title)}</h3><p>${esc(c.text)}</p><a class="more" href="${c.link}" target="_blank" rel="noopener">Click here ${ICON.ext}</a></div></article>`).join("")}</div>
    </div></section>`;

    /* ---- evolution path (original timeline) ---- */
    const exps = EXP_ORDER.map((id) => D.experience.find((x) => x.id === id)).filter(Boolean);
    const CW = 380, GAP = 24;
    h += `
    <section class="sec" id="experience" aria-labelledby="evo-h"><div class="wrap">
      ${label("08", "Trajectory")}<h2 class="rv pre" id="evo-h" style="font:700 clamp(36px,4.4vw,60px)/1 var(--f-display);margin-bottom:46px">Evolution Path</h2>
      <div class="evo" id="evo"><div class="evo-in">
        <h3>${ICON.cap} Education</h3>
        <div class="row"><button class="tcard" type="button" data-open="academic" style="width:400px">
          <b>${esc(E.degree)}</b><div class="o">${esc(E.institution)}</div><div class="dt">${esc(E.dates)}</div><div class="cl">${esc(E.classification)}</div>
          <ul>${E.focus.slice(0, 2).map((f) => `<li>${esc(f)}</li>`).join("")}</ul><span class="go">View Academic Record ${ICON.arrow}</span>
        </button></div>
        <div class="tline" style="width:${exps.length * (CW + GAP) - GAP}px"><span class="end" style="left:0">Present</span><span class="end" style="right:0">2024</span>
          ${exps.map((x, i) => `<button class="node" type="button" data-open="${x.id}" style="left:${i * (CW + GAP) + CW / 2}px" aria-label="${esc(x.role)}, from ${esc(x.dates.split("–")[0].trim())}"><span>${esc(x.dates.split("–")[0].trim())}</span></button>`).join("")}
        </div>
        <h3>${ICON.brief} Experience</h3>
        <div class="row">${exps.map((x) => `<button class="tcard" type="button" data-open="${x.id}"><b>${esc(x.role)}</b><div class="o">${esc(x.org)}</div><div class="dt">${esc(x.dates)}</div><ul>${x.impacts.slice(0, 2).map((m) => `<li>${esc(m)}</li>`).join("")}</ul><span class="go">View Details ${ICON.arrow}</span></button>`).join("")}</div>
      </div></div>
      <p class="evo-hint">Scroll horizontally to explore timeline →</p>
    </div></section>`;

    /* ---- skill spectrum (original) ---- */
    h += `
    <section class="sec" id="skills" aria-labelledby="sk-h"><div class="wrap">
      ${label("09", "Capabilities")}<h2 class="rv pre" id="sk-h" style="font:700 clamp(36px,4.4vw,60px)/1 var(--f-display);margin-bottom:56px">Skill Spectrum</h2>
      <div class="spec">${D.skills.map((c) => `<div class="rv pre"><h3>${esc(c.cat)}</h3>${c.items.map((s) => `<div class="sk"><div class="t"><b style="font-weight:500">${esc(s[0])}</b><span>${esc(s[1])}</span></div><div class="bar"><i data-w="${LVW[s[1]] || 50}"></i></div><div class="m">${(c.lang ? ["Beginner", "Intermediate", "Native"] : ["Introduced", "Proficient", "Expert"]).map((m) => `<span>${m}</span>`).join("")}</div></div>`).join("")}</div>`).join("")}</div>
    </div></section>`;

    /* ---- one CV, matched to the discipline ---- */
    h += `
    <section class="sec" id="cv" aria-labelledby="cv-h"><div class="wrap cvbox">
      <a class="cvpg rv pre" href="${cv[1]}" download aria-label="Download the ${esc(cv[0])} CV"><img src="${cv[2]}" alt="First page of the ${esc(cv[0])} CV" loading="lazy"></a>
      <div>
        ${label("10", "Curriculum vitae")}
        <h2 class="rv pre" id="cv-h">The <span>${esc(cv[0])}</span> CV.</h2>
        <p class="rv pre">Tailored for ${esc(T.blurb.toLowerCase())}: ${esc(cv[3])}.</p>
        <div class="btns rv pre"><a class="btn solid" href="${cv[1]}" download>Download CV ${ICON.down}</a></div>
        <p class="other">Interested in a different discipline? <button type="button" data-menu>Switch the portfolio</button> and the CV changes with it.</p>
      </div>
    </div></section>`;

    /* ---- connect + footer ---- */
    const kw = ["Propulsion", "Formula Student", "CFD", "FEA", "Composites", "Control systems", "Data science", "Sustainability", "Aerodynamics", "Simulation"];
    h += `
    <section class="sec connect" id="contact" aria-labelledby="ct-h"><div class="wrap">
      ${label("11", "Contact")}
      <h2 class="rv pre" id="ct-h">Let's connect.</h2>
      <p class="lead rv pre">${esc(P.availability)} Open to graduate roles in aerospace, motorsport, energy and advanced engineering.</p>
      <div class="clinks rv pre">
        <a href="mailto:${P.email}"><small>Email</small><b>${P.email}</b></a>
        <a href="${P.linkedin}" target="_blank" rel="noopener"><small>LinkedIn</small><b>Omar Elarabi ${ICON.ext.replace("<svg", '<svg width="14" height="14"')}</b></a>
        <a href="${cv[1]}" download><small>${esc(cv[0])}</small><b>Download CV</b></a>
      </div>
      <div class="build rv pre">${HEX("bg")}<div><h3>Build something?</h3><p>Whether it's a graduate role, a project or a question about the work, I'd like to hear from you.</p></div><div class="btns"><a class="btn solid" href="mailto:${P.email}">Email Omar ${ICON.arrow}</a><a class="btn" href="${cv[1]}" download>Download CV</a></div></div>
    </div></section>
    <footer><div class="wrap">
      <div class="cols">
        <div><a class="logo" href="#top" data-jump="top">${HEX()}<span><b>Omar Elarabi</b><small>Aerospace Eng.</small></span></a><p style="color:var(--ink-3);font-size:14px;margin-top:16px;max-width:34ch">${esc(P.degree)}, ${esc(P.honours)}. ${esc(P.institution)}.</p></div>
        <div><h5>Sections</h5>${RAIL.slice(1).map((r) => `<a href="#${r[0]}" data-jump="${r[0]}">${r[1]}</a>`).join("")}</div>
        <div><h5>Case studies</h5>${D.projects.map((p) => `<a href="#${p.id}" data-open="${p.id}">${esc(p.title)}</a>`).join("")}</div>
        <div><h5>Elsewhere</h5><a href="${P.linkedin}" target="_blank" rel="noopener">LinkedIn</a><a href="mailto:${P.email}">Email</a><a href="#" data-menu>Change discipline</a></div>
      </div>
    </div>
    <div class="ticker" aria-hidden="true"><div>${[0, 1].map(() => kw.map((k) => `<span>${k}</span><i>/</i>`).join("")).join("")}</div></div>
    <div class="wrap"><div class="mark" aria-hidden="true">ELARABI</div>
      <div class="legal"><span>© 2026 Omar Elarabi</span><span>Viewing: ${esc(T.name)} · ${isDark() ? "dark" : "light"}</span><a href="#top" data-jump="top" style="text-decoration:none">Back to top ↑</a></div></div>
    </footer>`;

    main.innerHTML = h;
    $("#srail").innerHTML = `<div class="num" id="rail-n">01 / ${String(RAIL.length).padStart(2, "0")}</div>` + RAIL.map((r) => `<a href="#${r[0]}" data-jump="${r[0]}"><span>${r[1]}</span><i></i></a>`).join("");
    $("#disc-nm").textContent = T.short;
    $("#nav-cv").href = cv[1];
    $("#nav-cv").setAttribute("aria-label", `Download the ${cv[0]} CV`);
    $("#disc-list").innerHTML = TH.map((t) => `<button type="button" role="menuitemradio" aria-checked="${t.id === disc}" data-disc="${t.id}"><i style="background:${PAL[t.id][isDark() ? "d" : "l"][1]}"></i><span><b>${esc(t.name)}</b><span>${esc(t.blurb)}</span></span></button>`).join("");
    bind(); fitMark();
  }
  function fitMark() {
    const el = $("footer .mark"); if (!el) return; const p = el.parentElement, cs = getComputedStyle(p);
    const w = p.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    el.style.fontSize = "100px"; const nat = el.scrollWidth; el.style.fontSize = Math.floor((100 * w) / nat * 0.985) + "px";
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => fitMark());

  function gearPath() {
    let d = ""; const n = 10;
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2, a1 = a0 + Math.PI / n * 0.45, a2 = a0 + Math.PI / n, a3 = a2 + Math.PI / n * 0.45;
      const p = (a, r) => `${(50 + Math.cos(a) * r).toFixed(1)} ${(50 + Math.sin(a) * r).toFixed(1)}`;
      d += `${i ? "L" : "M"}${p(a0, 44)} L${p(a1, 44)} L${p(a1 + 0.05, 34)} L${p(a3 - 0.05 + Math.PI / n * 0.55, 34)} `;
    }
    return d + "Z";
  }

  function brakeSVG() {
    return `<svg viewBox="0 0 300 200" role="img" aria-label="Concept: conductive fin passing between magnets for eddy-current braking, with friction pads as backup">
      <rect x="20" y="96" width="260" height="10" rx="3" style="fill:var(--ink-3)" opacity=".5"/><text x="24" y="124" style="font:500 10px var(--f-mono);fill:var(--ink-3)">conductive fin (track)</text>
      <rect x="95" y="40" width="70" height="44" rx="6" style="fill:var(--acc)"/><rect x="95" y="118" width="70" height="44" rx="6" style="fill:var(--acc)"/>
      <text x="130" y="67" text-anchor="middle" style="font:700 14px var(--f-display);fill:#fff">N</text><text x="130" y="145" text-anchor="middle" style="font:700 14px var(--f-display);fill:#fff">S</text>
      <ellipse cx="130" cy="101" rx="26" ry="5" fill="none" style="stroke:var(--acc2)" stroke-width="2"/><ellipse cx="130" cy="101" rx="14" ry="3" fill="none" style="stroke:var(--acc2)" stroke-width="2"/>
      <rect x="210" y="70" width="34" height="18" rx="3" style="fill:var(--ink-2)"/><rect x="210" y="114" width="34" height="18" rx="3" style="fill:var(--ink-2)"/>
      <text x="130" y="186" text-anchor="middle" style="font:500 10px var(--f-mono);fill:var(--ink-2)">primary: eddy current</text><text x="227" y="58" text-anchor="middle" style="font:500 10px var(--f-mono);fill:var(--ink-2)">backup pads</text>
      <path d="M40 30 h30" style="stroke:var(--ink)" stroke-width="2" marker-end="url(#bah)"/><defs><marker id="bah" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" style="fill:var(--ink)"/></marker></defs><text x="40" y="22" style="font:500 10px var(--f-mono);fill:var(--ink-3)">motion</text>
    </svg>`;
  }

  /* =================== BINDINGS (re-run after each render) =================== */
  let R = {}, heroRain = null, scene = null, curStep = -1, curMuf = -1, galLen = 0, vh = window.innerHeight, ink = [0, 0, 0], acc = [0, 0, 0];
  function readInk() {
    const probe = document.createElement("i"); probe.style.cssText = "position:absolute;color:var(--ink);background-color:var(--acc)"; $("#top") ? $("#top").appendChild(probe) : document.body.appendChild(probe);
    const cs = getComputedStyle(probe), pc = (s) => (s.match(/[\d.]+/g) || [0, 0, 0]).slice(0, 3).map((v) => +v / 255);
    ink = pc(cs.color); acc = pc(cs.backgroundColor); probe.remove();
  }
  function bind() {
    R = { hero: $("#top"), slogan: $("#slogan"), reveal: $("#reveal"), muf: $("#muf"), gal: $("#gal"), track: $("#track"), callouts: $("#callouts"), hcv: $("#hcv"), gear: $("#gear"),
      words: $$("#slogan .w"), rsteps: $$("#reveal .step"), rdots: $$("#reveal .dots i"), rhs: $$("#reveal .hs"), rimg: $("#rimg"), rglow: $("#rglow"), rail: $$("#srail a") };
    curStep = -1; curMuf = -1;
    if (scene) scene.dispose(); scene = null;
    const mk = () => { if (!R.hcv || !document.body.contains(R.hcv)) return; scene = new window.Scene3D(R.hcv); scene.set(T.model); };
    if (window.Scene3D) mk(); else window.addEventListener("scene3d-ready", mk, { once: true });
    R.code = $("#hcode"); heroRain = R.code ? new CodeRain(R.code) : null;
    readInk(); layout(); paintTheme(false);
    // reveal-on-view
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.remove("pre"); io.unobserve(e.target); countUp(e.target); } }), { rootMargin: "0px 0px -8% 0px" });
    $$(".rv.pre").forEach((el) => io.observe(el));
    const io2 = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { $$(".bar i[data-w]", e.target).forEach((b) => (b.style.width = b.dataset.w + "%")); io2.unobserve(e.target); } }), { threshold: 0.2 });
    $$(".spec > div").forEach((el) => io2.observe(el));
    dragScroll($("#evo"));
  }
  function countUp(el) {
    const b = $("b[data-count]", el); if (!b || reduced) return;
    const m = b.dataset.count.match(/^([\d,.]+)(\D*)$/); if (!m) return;
    const target = parseFloat(m[1].replace(/,/g, "")), dec = (m[1].split(".")[1] || "").length, comma = m[1].includes(","), t0 = performance.now();
    const fmt = (v) => { let s = v.toFixed(dec); if (comma) s = Number(s).toLocaleString("en-GB", { minimumFractionDigits: dec, maximumFractionDigits: dec }); return s + m[2]; };
    const st = (t) => { const k = clamp((t - t0) / 1400, 0, 1); b.textContent = fmt(target * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(st); else b.textContent = b.dataset.count; };
    requestAnimationFrame(st);
  }
  function dragScroll(s) {
    if (!s) return; let down = false, sx = 0, sl = 0;
    s.addEventListener("pointerdown", (e) => { if (e.pointerType !== "mouse" || e.target.closest("button")) return; down = true; sx = e.clientX; sl = s.scrollLeft; s.style.cursor = "grabbing"; });
    window.addEventListener("pointermove", (e) => { if (down) s.scrollLeft = sl - (e.clientX - sx); });
    window.addEventListener("pointerup", () => { down = false; s.style.cursor = ""; });
  }
  function layout() {
    vh = window.innerHeight;
    if (scene) scene.resize(); if (heroRain) heroRain.resize();
    if (R.track && R.gal) { galLen = Math.max(0, R.track.scrollWidth - window.innerWidth); R.gal.style.height = galLen + vh + "px"; }
  }
  window.addEventListener("resize", () => { layout(); fitMark(); gRain && gRain.resize(); });

  /* ---------- theme (light / dark) ---------- */
  const SUN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    MOON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/></svg>';
  function paintTheme(reread = true) {
    $$(".theme-btn").forEach((b) => { b.innerHTML = isDark() ? SUN : MOON; b.setAttribute("aria-label", isDark() ? "Switch to light mode" : "Switch to dark mode"); });
    $$("#disc-list i").forEach((i, k) => (i.style.background = PAL[TH[k].id][isDark() ? "d" : "l"][1]));
    const lg = $("footer .legal span:nth-child(2)"); if (lg) lg.textContent = `Viewing: ${T.name} · ${isDark() ? "dark" : "light"}`;
    if (reread) setTimeout(readInk, 30);
  }
  $$(".theme-btn").forEach((b) => b.addEventListener("click", () => { const n = isDark() ? "light" : "dark"; root.dataset.theme = n; try { localStorage.setItem("oe-theme", n); } catch (e) {} paintTheme(); }));
  mq.addEventListener && mq.addEventListener("change", () => paintTheme());

  /* ---------- delegated clicks ---------- */
  const menu = $("#disc-menu"), mbtn = $("#disc-btn");
  const setMenu = (o) => { menu.classList.toggle("open", o); mbtn.setAttribute("aria-expanded", String(o)); };
  mbtn.addEventListener("click", (e) => { e.stopPropagation(); setMenu(!menu.classList.contains("open")); });
  function jump(id) { const el = document.getElementById(id); if (!el) return; setMenu(false); window.scrollTo({ top: id === "top" ? 0 : el.getBoundingClientRect().top + window.scrollY - (id === "work" || id === "projects" ? 0 : 40), behavior: reduced ? "auto" : "smooth" }); }
  // file downloads: inside the claude.ai viewer use the downloads capability; elsewhere the plain link works
  let DL = null;
  try { if (window.claude && window.claude.use) window.claude.use("downloads").then((n) => { DL = n; }).catch(() => {}); } catch (e) {}
  document.addEventListener("click", async (e) => {
    const dl = e.target.closest("a[download]"); if (!dl || !DL) return;
    e.preventDefault(); e.stopPropagation();
    try { const blob = await (await fetch(dl.getAttribute("href"))).blob(); await DL.save({ filename: dl.getAttribute("href").split("/").pop(), data: blob }); }
    catch (err) { if (err && err.code !== "declined") toast("Download unavailable here. Use the email link to request a copy."); }
  }, true);
  document.addEventListener("click", (e) => {
    const dsc = e.target.closest("[data-disc]");
    if (dsc && menu.contains(dsc)) { e.preventDefault(); setMenu(false); switchTheme(dsc.dataset.disc, e.clientX, e.clientY); return; }
    if (e.target.closest("[data-menu]")) { e.preventDefault(); e.stopPropagation(); window.scrollTo({ top: window.scrollY }); setMenu(true); mbtn.focus({ preventScroll: true }); return; }
    if (!e.target.closest("#disc-menu")) setMenu(false);
    const j = e.target.closest("[data-jump]"); if (j) { e.preventDefault(); jump(j.dataset.jump); return; }
    const o = e.target.closest("[data-open]"); if (o) { e.preventDefault(); openDossier(o.dataset.open, true); return; }
    const c = e.target.closest("[data-cfd]"); if (c) { const i = +c.dataset.cfd; $$(".cfdcmp [data-cfd]").forEach((x) => x.setAttribute("aria-selected", String(+x.dataset.cfd === i))); $$(".cfdp").forEach((p, k) => (p.hidden = k !== i)); }
  });
  document.addEventListener("keydown", (e) => { if ((e.key === "Enter" || e.key === " ") && e.target.matches && e.target.matches("article[data-open]")) { e.preventDefault(); openDossier(e.target.dataset.open, true); } if (e.key === "Escape") setMenu(false); });

  /* ---------- discipline switch with curtain ---------- */
  const curtain = $("#curtain");
  let switching = false;
  function curtainRun(id, x, y, mid, word) {
    switching = true; const pal = PAL[id][isDark() ? "d" : "l"];
    curtain.style.transition = "none"; curtain.style.opacity = "1"; curtain.classList.remove("on"); void curtain.offsetWidth; curtain.style.transition = "";
    curtain.style.setProperty("--cx", (x == null ? innerWidth / 2 : x) + "px"); curtain.style.setProperty("--cy", (y == null ? innerHeight / 2 : y) + "px");
    curtain.style.setProperty("--c-bg", pal[0]); curtain.style.setProperty("--c-ink", pal[1]);
    $("#cname").textContent = thm(id).name; $(".t", curtain).textContent = word || "Reconfiguring";
    requestAnimationFrame(() => curtain.classList.add("on"));
    if (id === "data" && !reduced) { const cr = new CodeRain($("#ccode")); const t0 = performance.now(); (function loop(n) { cr.frame(n / 1000, true, pal[1]); if (n - t0 < 2300) requestAnimationFrame(loop); else cr.frame(0, false); })(t0); }
    setTimeout(() => { mid(); }, reduced ? 50 : 820);
    setTimeout(() => { curtain.style.transition = "opacity .6s cubic-bezier(.22,1,.36,1)"; curtain.style.opacity = "0"; }, reduced ? 100 : 1700);
    setTimeout(() => { curtain.style.transition = "none"; curtain.classList.remove("on"); curtain.style.opacity = "1"; void curtain.offsetWidth; curtain.style.transition = ""; switching = false; }, reduced ? 200 : 2350);
  }
  function applyDisc(id) {
    disc = id; frame.act = -1; root.dataset.disc = id; try { localStorage.setItem("oe-disc", id); } catch (e) {}
    window.scrollTo(0, 0); render();
  }
  function switchTheme(id, x, y) { if (switching) return; if (id === disc) { toast(`Already viewing ${thm(id).name}`); return; } curtainRun(id, x, y, () => applyDisc(id)); }
  function toast(t) { const el = $("#toast"); el.textContent = t; el.classList.add("on"); clearTimeout(toast.k); toast.k = setTimeout(() => el.classList.remove("on"), 2200); }

  /* =================== CODE RAIN (Data Analytics) =================== */
  const CODE = ["import pandas as pd", "from sklearn.decomposition import PCA", "from sklearn.preprocessing import StandardScaler", "df = pd.read_csv('flights.csv')", "X = StandardScaler().fit_transform(df[features])", "pca = PCA(n_components=4).fit(X)", "scores = pca.transform(X)", "print(pca.explained_variance_ratio_)", "[coeff, score, latent] = pca(X);", "fis = mamfis('Name', 'taxiTime');", "fis = addInput(fis, [-3 3], 'Name', 'PC1');", "fis = addMF(fis, 'PC1', 'gaussmf', [1 0]);", "taxi = evalfis(fis, score(:, 1:4));", "plt.scatter(scores[:, 0], scores[:, 1], s=4)", "for k = 1:numel(flights)", "features = df.columns.drop('taxi_time')", "corr = df[features].corr()", "keep = rank_by_loading(pca, 29)"];
  function CodeRain(cv) {
    const ctx = cv.getContext("2d"); let W = 0, H = 0, cols = [], typed = [], on = 0, last = 0;
    const src = CODE.join("  ·  ");
    this.resize = () => { const r = cv.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1); W = r.width; H = r.height; cv.width = Math.round(W * d); cv.height = Math.round(H * d); ctx.setTransform(d, 0, 0, d, 0, 0);
      const n = Math.ceil(W / 18); cols = Array.from({ length: n }, (_, i) => ({ x: i * 18 + 4, y: Math.random() * H, v: 40 + Math.random() * 90, o: Math.floor(Math.random() * src.length), len: 10 + Math.floor(Math.random() * 16) })); };
    this.resize();
    this.frame = (t, active, color, o = {}) => { const K = o.k || 1, BOX = o.box || "rgba(0,0,0,.55)";
      on += ((active ? 1 : 0) - on) * 0.12; if (on < 0.01 && !active) { if (last) { ctx.clearRect(0, 0, W, H); last = 0; } return; }
      const dt = last ? Math.min(0.05, t - last) : 0.016; last = t || 0.0001;
      if (!W) this.resize(); ctx.clearRect(0, 0, W, H); ctx.font = "500 13px 'JetBrains Mono', ui-monospace, monospace"; ctx.fillStyle = color;
      cols.forEach((c) => { c.y += c.v * dt; if (c.y - c.len * 16 > H) { c.y = -Math.random() * 200; c.o = Math.floor(Math.random() * src.length); }
        for (let k = 0; k < c.len; k++) { const ch = src[(c.o + Math.floor(c.y / 16) - k + src.length * 4) % src.length]; if (ch === " ") continue; ctx.globalAlpha = on * K * (k === 0 ? 0.9 : 0.42 * (1 - k / c.len)); ctx.fillText(ch, c.x, c.y - k * 16); } });
      if (typed.length < 3 && Math.random() < 0.02) typed.push({ s: CODE[Math.floor(Math.random() * CODE.length)], x: 20 + Math.random() * Math.max(10, W - 380), y: 40 + Math.random() * (H - 80), t: 0 });
      ctx.font = "600 14px 'JetBrains Mono', ui-monospace, monospace";
      typed = typed.filter((l) => { l.t += dt; const n = Math.min(l.s.length, Math.floor(l.t * 28)), fade = l.t > 3.4 ? 1 - (l.t - 3.4) / 0.8 : 1; if (fade <= 0) return false;
        const txt = l.s.slice(0, n) + (n < l.s.length || Math.floor(l.t * 3) % 2 ? "▌" : ""); ctx.globalAlpha = on * Math.min(1, K * 1.4) * fade; ctx.fillStyle = BOX; const w = ctx.measureText(txt).width; ctx.fillRect(l.x - 8, l.y - 16, w + 16, 24); ctx.fillStyle = color; ctx.fillText(txt, l.x, l.y); return true; });
      ctx.globalAlpha = 1;
    };
  }

  /* =================== GATE =================== */
  const gate = $("#gate"), gopts = $("#gopts");
  let gOpen = true;
  document.body.classList.add("locked");
  $("#gname").innerHTML = [..."Omar Elarabi"].map((c, i) => `<span style="animation-delay:${0.5 + i * 0.045}s">${c === " " ? "&nbsp;" : esc(c)}</span>`).join("");
  gopts.innerHTML = TH.map((t, i) => `<button class="opt" type="button" role="radio" aria-checked="false" data-g="${t.id}" style="--c:${PAL[t.id].d[1]}"><span class="dot"></span><span><b>${esc(t.name)}</b><span class="d">${esc(t.blurb)}</span></span><span class="n">0${i + 1}</span></button>`).join("");
  const gRain = new CodeRain($("#gcode"));
  // the room: a still of Omar's study with live rain; pinned objects open each discipline's world
  let room = null, gSel = null;
  const SUBS = { structures: "Workshop", aero: "Wind tunnel lab", control: "Grid control room", data: "Data office" };
  const mkRoom = () => {
    if (room || !gOpen || !window.GateRoom) return;
    room = new window.GateRoom($("#gstage"), { items: TH.map((t) => ({ id: t.id, name: t.name, sub: SUBS[t.id] || t.short, color: PAL[t.id].d[1] })), onHover: (id) => markOpt(id), onPick: (id) => go(id) });
    if (gSel) room.select(gSel);
  };
  let roomWanted = false;
  const markOpt = (id) => $$(".opt", gopts).forEach((o) => o.classList.toggle("hot", o.dataset.g === id));
  const hoverG = (id) => { if (room) room.hover(id); markOpt(id); };
  function selectG(id) {
    gSel = id; if (room) room.select(id); hoverG(null);
    $$(".opt", gopts).forEach((o) => { const on = o.dataset.g === id; o.classList.toggle("on", on); o.setAttribute("aria-checked", String(on)); });
    gate.classList.toggle("chosen", !!id);
    if (id) { const t = thm(id); gate.style.setProperty("--g-bg", PAL[id].d[0]); gate.style.setProperty("--g-acc", PAL[id].d[1]); $("#gh").textContent = "Welcome to the " + ({ structures: "workshop.", aero: "wind tunnel lab.", control: "control room.", data: "data office." })[id]; $("#gstat").innerHTML = `ROOM · ${esc(t.short.toUpperCase())}<br>${esc(t.preset)}`; }
    else { gate.style.removeProperty("--g-bg"); gate.style.removeProperty("--g-acc"); $("#gh").textContent = "Select your technical pathway."; $("#gstat").innerHTML = "ROOM · STUDY<br>v3.0 · 2026"; }
  }
  gopts.addEventListener("pointerover", (e) => { const o = e.target.closest(".opt"); if (o) hoverG(o.dataset.g); });
  gopts.addEventListener("pointerleave", () => hoverG(null));
  gopts.addEventListener("click", (e) => { const o = e.target.closest(".opt"); if (o) go(o.dataset.g); });
  // a click on an object or a pathway goes straight in, the curtain opening from where you clicked
  let lastPt = [innerWidth * 0.7, innerHeight * 0.45];
  gate.addEventListener("pointerdown", (e) => (lastPt = [e.clientX, e.clientY]), true);
  function go(id) { if (!gOpen || switching) return; selectG(id); enter(id, lastPt[0], lastPt[1]); }
  function enter(id, x, y) {
    if (!gOpen || switching) return;
    curtainRun(id, x, y, () => {
      gOpen = false; gate.hidden = true; document.body.classList.remove("locked"); if (room) { room.dispose(); room = null; }

      disc = id; root.dataset.disc = id; try { localStorage.setItem("oe-disc", id); } catch (e) {}
      render(); window.scrollTo(0, 0); routeFromHash(false);
    }, "Loading discipline");
  }
  // loader: real preloading of the key images, with a minimum show time
  (function load() {
    const imgs = ["img/headshot.webp", "img/exhaust-assembly.webp", ...D.projects.map((p) => p.hdr), ...MUF.flatMap((m) => [`img/muf-${m[1]}-shell.webp`, `img/muf-${m[1]}-xray.webp`]), ...P.cvs.map((c) => c[2])];
    const tasks = ["Loading geometry", "Meshing domain", "Solving", "Converging residuals", "Post-processing"];
    let done = 0, shown = 0; const t0 = performance.now(), total = imgs.length + 1;
    const tick = () => { done++; };
    imgs.forEach((src) => { const im = new Image(); im.onload = im.onerror = tick; im.src = src; });
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(tick);
    const MIN = reduced ? 300 : 2300, MAX = 7000;
    (function step() {
      const el = performance.now() - t0, real = done / total, timeK = Math.min(1, el / MIN);
      const target = el > MAX ? 1 : Math.min(real, timeK); shown += (target - shown) * 0.12; if (target >= 1 && shown > 0.995) shown = 1;
      $("#gbar").style.width = (shown * 100).toFixed(1) + "%"; $("#gpct").textContent = Math.round(shown * 100) + "%"; $("#gtask").textContent = tasks[Math.min(tasks.length - 1, Math.floor(shown * tasks.length))];
      if (shown < 1) { requestAnimationFrame(step); return; }
      $("#gtask").textContent = "Ready"; $("#gstat").innerHTML = "SYS · READY<br>v3.0 · 2026";
      setTimeout(() => { $("#gload").classList.add("out"); gate.classList.add("live"); $("#gpick").classList.add("on"); $("#gstage").classList.add("on"); roomWanted = true; mkRoom(); $("#gstat").innerHTML = "ROOM · STUDY<br>v3.0 · 2026"; const last = $(`.opt[data-g="${disc}"] .d`, gopts); if (last && hadSaved) last.insertAdjacentHTML("beforeend", " · last viewed"); }, 350);
    })();
  })();

  /* =================== FRAME LOOP =================== */
  let mx = 0, my = 0;
  window.addEventListener("pointermove", (e) => { mx = (e.clientX / innerWidth) * 2 - 1; my = (e.clientY / innerHeight) * 2 - 1; }, { passive: true });
  const prog = (el) => { if (!el) return 0; const r = el.getBoundingClientRect(); return clamp(-r.top / Math.max(1, r.height - vh), 0, 1); };
  function stepLevel(t) { const k = t % 18; return 1.1 * (1 - Math.exp(-k / 1.7) * (Math.cos(1.6 * k) + 0.5 * Math.sin(1.6 * k))) * (k < 16 ? 1 : 1 - (k - 16) / 2); }
  function callouts(res) {
    const svg = R.callouts; if (!svg || !res) return;
    const sr = svg.getBoundingClientRect(), W = sr.width, H = sr.height, op = clamp((res.zoom - 0.6) / 0.25, 0, 1);
    if (op <= 0) { if (svg.innerHTML) svg.innerHTML = ""; return; }
    const cx = R.hcv.offsetLeft, cy = R.hcv.offsetTop, small = W < 440;
    const pts = res.labels.map(([n, p], i) => ({ n, i, ax: p[0] + cx, ay: p[1] + cy }));
    const sides = { l: [], r: [] }; pts.forEach((p) => sides[p.ax > W * 0.52 ? "r" : "l"].push(p));
    let out = "";
    ["l", "r"].forEach((s) => {
      const arr = sides[s].sort((a, b) => a.ay - b.ay); let prev = -1e9;
      arr.forEach((p) => { p.ly = clamp(Math.max(p.ay, prev + (small ? 34 : 46)), 24, H - 20); prev = p.ly; });
      arr.forEach((p) => {
        const tx = s === "r" ? W - 4 : 4, ex = s === "r" ? W - (small ? 108 : 168) : (small ? 108 : 168), anc = s === "r" ? "end" : "start";
        out += `<g class="c" style="opacity:${op.toFixed(2)}"><polyline points="${p.ax.toFixed(1)},${p.ay.toFixed(1)} ${ex.toFixed(1)},${p.ly.toFixed(1)} ${tx},${p.ly.toFixed(1)}"/><circle class="dot" cx="${p.ax.toFixed(1)}" cy="${p.ay.toFixed(1)}" r="4.5"/><text x="${tx}" y="${(p.ly - 7).toFixed(1)}" text-anchor="${anc}" style="${small ? "font-size:9px" : ""}">${esc(p.n)}</text><text class="n" x="${tx}" y="${(p.ly + 15).toFixed(1)}" text-anchor="${anc}" style="${small ? "font-size:9px" : ""}">0${p.i + 1}</text></g>`;
      });
    });
    svg.innerHTML = out;
  }
  function frame(now) {
    const time = now / 1000;
    if (gOpen) { gRain.frame(time, gSel === "data", PAL.data.d[1], { k: 0.5, box: "rgba(3,20,13,.85)" }); if (room) room.frame(now); }
    if (!gOpen && !paused && R.hero) {
      const nav = $("#nav"); nav.classList.toggle("solid", window.scrollY > 30);
      // hero
      const hp = prog(R.hero), hr = R.hero.getBoundingClientRect();
      if (heroRain) heroRain.frame(time, disc === "data" && hr.bottom > 0, `rgb(${acc.map((v) => Math.round(v * 255)).join(",")})`, { k: isDark() ? 0.9 : 0.8, box: isDark() ? "rgba(3,20,13,.8)" : "rgba(240,253,244,.85)" });
      if (scene && hr.bottom > 0) {
        const wide = innerWidth > 900;
        const z = smooth(clamp(hp * 1.12, 0, 1));
        const res = scene.render({ prog: z, time: reduced ? 0 : time, mx, my, ink, acc, dark: isDark(), scale: 1, off: [0, 0], level: stepLevel(time) });
        callouts(res);
      }
      // slogan
      const sp = prog(R.slogan); const on = Math.round(clamp(sp * 1.3, 0, 1) * R.words.length); R.words.forEach((w, i) => w.classList.toggle("on", i < on));
      // exhaust reveal
      const rp = prog(R.reveal); const si = Math.min(steps.length - 1, Math.floor(rp * steps.length * 0.999));
      if (si !== curStep) { curStep = si; R.rsteps.forEach((s, i) => s.classList.toggle("on", i === si)); R.rdots.forEach((d, i) => d.classList.toggle("on", i === si)); const lit = new Set(steps.slice(0, si + 1).flatMap((s) => s.spots)); R.rhs.forEach((s, i) => s.classList.toggle("on", lit.has(i))); }
      if (!reduced && R.rimg) { R.rimg.style.transform = `scale(${(0.84 + rp * 0.22).toFixed(3)}) rotateY(${(-10 + rp * 16 + mx * 5).toFixed(2)}deg) rotateX(${(4 - rp * 6).toFixed(2)}deg)`; R.rglow.style.opacity = (0.35 + rp * 0.65).toFixed(2); }
      // muffler stages
      const mp = prog(R.muf), mi = Math.min(MUF.length - 1, Math.floor(mp * MUF.length * 0.999));
      if (mi !== curMuf) { curMuf = mi; $("#muf-t").textContent = MUF[mi][0]; $$("#muf figure").forEach((f) => $$("img", f).forEach((im, k) => im.classList.toggle("on", k === mi))); $$("#muf .chips span").forEach((s, k) => s.classList.toggle("on", k === mi)); $("#muf-kv").innerHTML = MUF[mi][2].map((k) => `<div><span>${k[0]}</span><b>${k[1]}</b></div>`).join(""); }
      // gallery
      const gp = prog(R.gal); R.track.style.transform = `translate3d(${(-gp * galLen).toFixed(1)}px,0,0)`; $("#gal-bar").style.width = (gp * 100).toFixed(1) + "%"; $("#gal-n").textContent = String(2 + Math.min(4, Math.round(gp * 4))).padStart(2, "0");
      // gear
      if (R.gear && !reduced) R.gear.style.transform = `rotate(${(window.scrollY * 0.25) % 360}deg)`;
      // right rail
      let act = 0; RAIL.forEach((r, i) => { const el = document.getElementById(r[0]); if (el && el.getBoundingClientRect().top < vh * 0.45) act = i; });
      if (act !== frame.act) { frame.act = act; R.rail.forEach((a, i) => a.classList.toggle("on", i === act)); $("#rail-n").textContent = `${String(act + 1).padStart(2, "0")} / ${String(RAIL.length).padStart(2, "0")}`; $$(".nav .links a").forEach((a) => a.classList.toggle("on", a.dataset.jump === RAIL[act][0])); }
    }
    requestAnimationFrame(frame);
  }
  render();
  requestAnimationFrame(frame);


  /* =================== ACADEMIC RECORD (original EducationDetail layout) =================== */
  function academicDossier() {
    const yearSec = (y, i) => {
      const cc = y.courses.filter((c) => c[5] > 0), av = cc.reduce((a, c) => a + c[3], 0) / cc.length, na = cc.filter((c) => c[4] === "A").length;
      return { id: "y" + (i + 1), label: `Year ${i + 1} · ${y.year}`, blocks: [
        { type: "stats", items: [["Credits", String(y.credits), ""], ["ECTS", String(y.ects), ""], ["Average mark", av.toFixed(1), "credit-bearing modules"], ["Grade A", `${na} of ${cc.length}`, "modules"]] },
        { type: "raw", html: `<div class="blk tbl"><div class="tt">Academic year ${esc(y.year)}</div><table><thead><tr><th>Module code</th><th>Module title</th><th>Level</th><th>Mark</th><th>Grade</th><th>Credits</th><th>ECTS</th><th>Result</th></tr></thead><tbody>${y.courses.map((c) => `<tr><td style="font-family:var(--f-mono);font-size:12.5px">${c[0]}</td><td>${esc(c[1])}</td><td>${c[2]}</td><td><b>${c[3].toFixed(1)}</b></td><td><span class="grade ${c[4]}">${c[4]}</span></td><td>${c[5]}</td><td>${c[5] / 2}</td><td>Pass</td></tr>`).join("")}</tbody></table></div>` },
      ] };
    };
    return { id: "academic", kicker: "Education · Academic record", title: "Academic Record", fullTitle: E.degree, descriptor: `${E.institution} · ${E.dates} · ${E.classification}`, dossier: [
      { id: "overview", label: "Overview", blocks: [
        { type: "kv", items: [["Degree", E.degree], ["Classification", E.classification], ["Institution", E.institution], ["Dates", E.dates]] },
        { type: "subhead", text: "Areas of specialisation" }, { type: "chips", items: E.focus },
      ] },
      ...E.years.map(yearSec),
      { id: "summary", label: "Performance summary", blocks: [
        { type: "stats", items: [["Total credits", String(totalCred), `${totalCred / 2} ECTS`], ["Average mark", avgMark.toFixed(1), "across credit-bearing modules"], ["Grade A modules", `${aCount} of ${credC.length}`, "credit-bearing"], ["Classification", "First", E.classification]] },
      ] },
    ] };
  }

  /* =================== TACHOMETER + DRIVER POV =================== */
  let tpRAF = 0;
  function stopTP() { cancelAnimationFrame(tpRAF); tpRAF = 0; }
  const TA = (v) => 135 + (v / 16) * 270; // degrees, 0..16 (x1000 rpm), 8 at the top
  const pol = (a, r) => [150 + Math.cos(a * Math.PI / 180) * r, 150 + Math.sin(a * Math.PI / 180) * r];
  function arc(v0, v1, r) { const [x0, y0] = pol(TA(v0), r), [x1, y1] = pol(TA(v1), r); return `M${x0.toFixed(2)} ${y0.toFixed(2)} A${r} ${r} 0 ${TA(v1) - TA(v0) > 180 ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`; }
  function tachoSVG() {
    let ticks = "", nums = "";
    for (let i = 0; i <= 80; i++) { const v = i / 5, a = TA(v), major = i % 5 === 0, red = v >= 13.5;
      const [x0, y0] = pol(a, major ? 102 : 110), [x1, y1] = pol(a, 118);
      ticks += `<line x1="${x0.toFixed(1)}" y1="${y0.toFixed(1)}" x2="${x1.toFixed(1)}" y2="${y1.toFixed(1)}" stroke="${red ? "#ff3b30" : "#e9ecf1"}" stroke-width="${major ? 3 : 1.2}" stroke-linecap="round" opacity="${major ? 1 : 0.7}"/>`;
      if (major) { const [tx, ty] = pol(a, 86); nums += `<text x="${tx.toFixed(1)}" y="${(ty + 6).toFixed(1)}" text-anchor="middle" fill="${red ? "#ff3b30" : "#f4f6f8"}" style="font:700 17px Montserrat,sans-serif">${v}</text>`; } }
    const leds = Array.from({ length: 10 }, (_, i) => `<circle class="led" data-led="${i}" cx="${105 + i * 10}" cy="238" r="3.4" fill="#2a2d33"/>`).join("");
    return `<svg viewBox="0 0 300 300" role="img" aria-label="Tachometer at the 8,000 rpm simulation point; the needle fluctuates either side of 8,000">
      <defs>
        <radialGradient id="tz" cx="50%" cy="38%" r="70%"><stop offset="0" stop-color="#3a3e46"/><stop offset=".55" stop-color="#16181c"/><stop offset="1" stop-color="#050507"/></radialGradient>
        <radialGradient id="tf" cx="50%" cy="45%" r="60%"><stop offset="0" stop-color="#1b1e24"/><stop offset="1" stop-color="#07080a"/></radialGradient>
        <linearGradient id="tg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></linearGradient>
        <radialGradient id="tc" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#6b7079"/><stop offset="1" stop-color="#121418"/></radialGradient>
        <filter id="tglow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <circle cx="150" cy="150" r="147" fill="url(#tz)"/><circle cx="150" cy="150" r="138" fill="#0b0c0f" stroke="#2c2f36" stroke-width="2"/>
      <circle cx="150" cy="150" r="132" fill="url(#tf)"/>
      <path d="${arc(13.5, 16, 124)}" fill="none" stroke="#ff3b30" stroke-width="7" opacity=".9"/>
      <path id="tp-band" d="${arc(0, 8, 124)}" fill="none" stroke="var(--acc)" stroke-width="3.5" opacity=".75" filter="url(#tglow)"/>
      ${ticks}${nums}
      <text x="150" y="112" text-anchor="middle" fill="#9aa1ab" style="font:600 9px Montserrat,sans-serif;letter-spacing:.2em">× 1000 r/min</text>
      <rect x="104" y="184" width="92" height="36" rx="5" fill="#020203" stroke="#2c2f36"/>
      <text id="tp-rpm" x="150" y="209" text-anchor="middle" fill="#f4f6f8" style="font:600 20px 'JetBrains Mono',ui-monospace,monospace;letter-spacing:.04em">8000</text>
      <text x="150" y="178" text-anchor="middle" fill="#6d737d" style="font:600 7.5px Montserrat,sans-serif;letter-spacing:.24em">RPM · SIM POINT</text>
      ${leds}
      <g id="tp-needle" filter="url(#tglow)"><path d="M147.6 160 L149.2 34 L150 28 L150.8 34 L152.4 160 Z" fill="#ff4d1f"/><path d="M148.5 160 L150 40 L151.5 160 Z" fill="#ffb199" opacity=".6"/></g>
      <circle cx="150" cy="150" r="15" fill="url(#tc)" stroke="#000" stroke-width="1.5"/><circle cx="150" cy="150" r="4" fill="#0b0c0f"/>
      <ellipse cx="150" cy="96" rx="118" ry="70" fill="url(#tg)" pointer-events="none"/>
    </svg>`;
  }
  function tachopovHTML() {
    return `<div class="blk"><div class="tpov"><div class="g">${tachoSVG()}</div><div class="v"><canvas id="pov" aria-label="Illustrative driver view at speed through a coned Formula Student course"></canvas><div class="hud">Driver POV · <b id="pov-rpm">8000</b> rpm</div></div></div>
      <figcaption>Simulation point: 8,000 rpm, a representative midrange operating point. The needle fluctuates either side of it, as engine speed does on track. The driver view is illustrative.</figcaption></div>`;
  }
  function startTP(root) {
    const needle = $("#tp-needle", root), rpmT = $("#tp-rpm", root), band = $("#tp-band", root), leds = $$(".led", root), cv = $("#pov", root), hud = $("#pov-rpm", root);
    if (!needle) return; stopTP();
    const ctx = cv.getContext("2d"); let W = 0, H = 0, dist = 0, last = performance.now(), noise = 0;
    const size = () => { const r = cv.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1); W = r.width; H = r.height; cv.width = Math.round(W * d); cv.height = Math.round(H * d); ctx.setTransform(d, 0, 0, d, 0, 0); };
    size(); const ro = new ResizeObserver(size); ro.observe(cv);
    const accCol = getComputedStyle(cv).getPropertyValue("--acc").trim() || "#ff3b30";
    const LED = ["#22c55e", "#22c55e", "#22c55e", "#22c55e", "#facc15", "#facc15", "#facc15", "#ef4444", "#ef4444", "#3b82f6"];
    function draw(rpm, t, curve) {
      const hz = H * 0.44, cxp = W / 2 + Math.sin(t * 0.45) * W * 0.03, shake = Math.sin(t * 60) * 0.6 * (rpm / 8000);
      ctx.save(); ctx.translate(0, shake);
      const sky = ctx.createLinearGradient(0, 0, 0, hz); sky.addColorStop(0, "#5b86b8"); sky.addColorStop(1, "#c9d9e8"); ctx.fillStyle = sky; ctx.fillRect(0, -4, W, hz + 4);
      ctx.fillStyle = "#3f5a3a"; ctx.beginPath(); ctx.moveTo(0, hz); for (let x = 0; x <= W; x += 14) ctx.lineTo(x, hz - 8 - Math.abs(Math.sin(x * 0.07 + 2)) * 12 - Math.abs(Math.sin(x * 0.021)) * 10); ctx.lineTo(W, hz); ctx.fill();
      ctx.fillStyle = "#5f7d4b"; ctx.fillRect(0, hz, W, H - hz);
      // road strips from far to near
      const N = 60, camH = 1.1, F = H * 0.9, roadW = 4.2;
      const zAt = (i) => 2 + i * 1.2, proj = (z, x) => [cxp + ((x - curve * z * z * 0.004) / z) * F * 0.6, hz + (camH / z) * F * 0.55];
      for (let i = N - 1; i >= 0; i--) {
        const z0 = zAt(i), z1 = zAt(i + 1), stripe = Math.floor((z0 + dist) / 2.4) % 2 === 0;
        const [l0x, y0] = proj(z0, -roadW), [r0x] = proj(z0, roadW), [l1x, y1] = proj(z1, -roadW), [r1x] = proj(z1, roadW);
        ctx.fillStyle = stripe ? "#3a3b3f" : "#36373b"; ctx.beginPath(); ctx.moveTo(l0x, y0); ctx.lineTo(r0x, y0); ctx.lineTo(r1x, y1); ctx.lineTo(l1x, y1); ctx.fill();
        const kw = 0.5; [[-roadW, -roadW - kw], [roadW, roadW + kw]].forEach(([a, b]) => { const [ax0] = proj(z0, a), [bx0] = proj(z0, b), [ax1] = proj(z1, a), [bx1] = proj(z1, b); ctx.fillStyle = stripe ? "#d7261e" : "#f2f2f2"; ctx.beginPath(); ctx.moveTo(ax0, y0); ctx.lineTo(bx0, y0); ctx.lineTo(bx1, y1); ctx.lineTo(ax1, y1); ctx.fill(); });
      }
      // cones: blue left, yellow right (Formula Student convention)
      for (let k = 0; k < 18; k++) { const z = 3 + ((k * 4.5 - dist) % 81 + 81) % 81; if (z < 2.2) continue; [[-roadW - 0.8, "#1f5fd6"], [roadW + 0.8, "#f6c218"]].forEach(([x, c]) => { const [px, py] = proj(z, x), s = (F * 0.5) / z; ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(px, py - s * 0.55); ctx.lineTo(px - s * 0.16, py); ctx.lineTo(px + s * 0.16, py); ctx.fill(); ctx.fillStyle = "#fff"; ctx.fillRect(px - s * 0.09, py - s * 0.3, s * 0.18, s * 0.06); }); }
      // speed lines
      ctx.strokeStyle = "rgba(255,255,255,.18)"; ctx.lineWidth = 1.2;
      for (let k = 0; k < 14; k++) { const a = (k / 14) * Math.PI * 2 + 0.3, ph = ((t * 2.4 + k * 0.37) % 1); const r0 = Math.min(W, H) * (0.35 + ph * 0.5), r1 = r0 + 30 + ph * 50; if (Math.abs(Math.sin(a)) < 0.25) continue; ctx.beginPath(); ctx.moveTo(cxp + Math.cos(a) * r0, hz + Math.sin(a) * r0 * 0.6); ctx.lineTo(cxp + Math.cos(a) * r1, hz + Math.sin(a) * r1 * 0.6); ctx.stroke(); }
      ctx.restore();
      // cockpit: chassis tubes, nose and wheel
      ctx.fillStyle = "#0d0e11"; ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(0, H * 0.62); ctx.lineTo(W * 0.2, H * 0.78); ctx.lineTo(W * 0.8, H * 0.78); ctx.lineTo(W, H * 0.62); ctx.lineTo(W, H); ctx.fill();
      ctx.fillStyle = "#1a1c21"; ctx.beginPath(); ctx.moveTo(W * 0.36, H * 0.79); ctx.lineTo(W * 0.46, H * 0.6); ctx.lineTo(W * 0.54, H * 0.6); ctx.lineTo(W * 0.64, H * 0.79); ctx.fill();
      ctx.strokeStyle = "#2b2e35"; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(W * 0.02, H * 0.5); ctx.lineTo(W * 0.2, H * 0.78); ctx.moveTo(W * 0.98, H * 0.5); ctx.lineTo(W * 0.8, H * 0.78); ctx.stroke();
      const sw = Math.min(W * 0.5, H * 0.75), sx = W / 2, sy = H * 0.98; ctx.save(); ctx.translate(sx, sy); ctx.rotate(Math.sin(t * 0.45) * 0.25 + curve * 0.02);
      ctx.fillStyle = "#121317"; ctx.strokeStyle = "#2a2c32"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-sw / 2, -sw * 0.42, sw, sw * 0.42, sw * 0.12) : ctx.rect(-sw / 2, -sw * 0.42, sw, sw * 0.42); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#1e2026"; ctx.fillRect(-sw / 2 - 6, -sw * 0.38, sw * 0.12, sw * 0.38); ctx.fillRect(sw / 2 - sw * 0.12 + 6, -sw * 0.38, sw * 0.12, sw * 0.38);
      ctx.fillStyle = "#050607"; ctx.fillRect(-sw * 0.17, -sw * 0.34, sw * 0.34, sw * 0.17);
      ctx.fillStyle = "#e9ecf1"; ctx.font = `600 ${Math.round(sw * 0.075)}px 'JetBrains Mono', monospace`; ctx.textAlign = "center"; ctx.fillText(String(Math.round(rpm / 10) * 10), 0, -sw * 0.215);
      const lit = Math.round(clamp((rpm - 5000) / 7000, 0, 1) * 10); for (let i = 0; i < 10; i++) { ctx.fillStyle = i < lit ? LED[i] : "#25272c"; ctx.beginPath(); ctx.arc(-sw * 0.16 + i * sw * 0.0355, -sw * 0.375, sw * 0.012, 0, 7); ctx.fill(); }
      ctx.restore();
      ctx.fillStyle = accCol; ctx.fillRect(0, H - 3, W * clamp(rpm / 16000, 0, 1), 3);
    }
    const t0 = performance.now();
    function loop(now) {
      const t = (now - t0) / 1000, dt = Math.min(0.05, (now - last) / 1000); last = now;
      noise += ((Math.random() - 0.5) * 160 - noise) * 0.08;
      const rpm = reduced ? 8000 : 8000 + 220 * Math.sin(t * 2.1) + 140 * Math.sin(t * 5.3 + 1) + noise;
      needle.setAttribute("transform", `rotate(${(TA(rpm / 1000) - 270).toFixed(2)} 150 150)`);
      band.setAttribute("d", arc(0, rpm / 1000, 124)); rpmT.textContent = String(Math.round(rpm / 10) * 10); hud.textContent = rpmT.textContent;
      const lit = Math.round(clamp((rpm - 5000) / 7000, 0, 1) * 10); leds.forEach((l, i) => l.setAttribute("fill", i < lit ? LED[i] : "#2a2d33"));
      dist += dt * 16 * (rpm / 8000); draw(rpm, t, Math.sin(t * 0.3) * 6);
      if (!document.body.contains(cv)) { ro.disconnect(); return; }
      tpRAF = requestAnimationFrame(loop);
    }
    tpRAF = requestAnimationFrame(loop);
  }
  /* =================== DOSSIER =================== */
  const dz = $("#dossier"), dScroll = $("#d-scroll"), dNav = $("#d-nav");
  let openId = null, lastFocus = null, tachoTimer = null;

  function expDossier(x) {
    const secs = [
      { id: "overview", label: "Role overview", blocks: [
        { type: "kv", items: [["Organisation", x.org], ["Dates", x.dates], ["Category", x.category]] },
        { type: "lead", text: x.context },
      ]},
    ];
    if (x.extra === "organiser") {
      const O = D.organiser;
      secs.push({ id: "programme", label: "Programme overview", blocks: [{ type: "p", text: O.overview }, { type: "stats", items: O.overviewStats.map((s) => [s[1], s[0], ""]) }] });
      secs.push({ id: "welcome", label: "Welcome Week", blocks: [
        { type: "h", text: "Welcome Week: strategic launch and coordinated outreach" },
        { type: "stats", items: O.welcomeStats.map((s) => [s[1], s[0], ""]) },
        { type: "cards", items: O.welcomePlan },
        { type: "imgcards", items: O.welcomeImages },
        { type: "subhead", text: "Week 0: in-person active promotion timeline" },
        { type: "week0", items: O.week0 },
      ]});
      secs.push({ id: "semester", label: "Semester A results", blocks: [
        { type: "h", text: "Formal report to the Education Department: Semester A, 2025–26" },
        { type: "stats", items: O.semesterStats.map((s) => [s[1], s[0], s[2]]) },
        { type: "chart", kind: "weekly" },
        { type: "p", text: O.weeklyNote },
        { type: "subhead", text: "Student feedback" },
        { type: "quotes", items: O.studentFeedback },
        { type: "stats", items: O.satisfaction.map((s) => [s[2], s[0], s[1]]) },
        { type: "subhead", text: "Mentor feedback" },
        { type: "quotes", items: O.mentorFeedback },
        { type: "stats", items: [["Average mentor rating", "4.83 / 5", "Overall experience as a PASS mentor"]] },
      ]});
    }
    if (x.extra === "mentor") {
      const M = D.mentor;
      secs.push({ id: "visual", label: "Outreach & award", blocks: [
        { type: "figure", src: M.stage.img, alt: M.stage.alt, caption: "Lecture theatre outreach" },
        { type: "cards", items: [["Context", M.stage.context], ["Objective", M.stage.objective], ["Impact", M.stage.impact]] },
        { type: "award", d: M.award },
      ]});
    }
    if (x.id === "hyperlink-braking") secs.push({ id: "concept", label: "Concept", blocks: [{ type: "raw", html: `<figure class="blk" style="max-width:520px">${brakeSVG()}<figcaption>Concept sketch: contactless eddy-current primary braking with friction pads as the fail-safe secondary system</figcaption></figure>` }] });
    secs.push({ id: "responsibilities", label: "Key responsibilities", blocks: [{ type: "list", items: x.responsibilities }] });
    secs.push({ id: "achievements", label: "Key achievements", blocks: [{ type: "steps", items: x.achievements }] });
    secs.push({ id: "skills", label: "Skills developed", blocks: [{ type: "cards", items: x.skills }] });
    secs.push({ id: "impact", label: "Impact summary", blocks: [{ type: "list", items: x.impacts }] });
    return { id: x.id, theme: "journey", kicker: x.category, title: x.fullRole || x.role, descriptor: `${x.org} · ${x.dates}`, dossier: secs };
  }

  function findDossier(id) {
    const p = D.projects.find((q) => q.id === id); if (p) return p;
    const x = D.experience.find((q) => q.id === id); if (x) return expDossier(x);
    if (id === "academic") return academicDossier();
    return null;
  }

  function openDossier(id, push) {
    const d = findDossier(id); if (!d) return;
    if (push && location.hash !== "#" + id) { history.pushState({ d: id }, "", "#" + id); }
    openId = id; lastFocus = document.activeElement;
    dz.dataset.ch = d.theme; $(".sheet", dz).dataset.ch = d.theme;
    $("#d-kicker").textContent = d.kicker; $("#d-title").textContent = d.title;
    dNav.innerHTML = d.dossier.map((s, i) => `<a href="#${id}" data-sec="${s.id}"><small>${String(i + 1).padStart(2, "0")}</small><span>${esc(s.label)}</span></a>`).join("");
    dScroll.innerHTML = (d.hdr ? `<div class="d-banner"><img src="${d.hdr}" alt=""></div>` : "") + `<header class="d-hero"><p class="eyebrow">${esc(d.kicker)}</p><h2>${esc(d.fullTitle || d.title)}</h2><p class="desc">${esc(d.descriptor)}</p></header>` +
      d.dossier.map((s, i) => `<section class="d-sec" id="d-${s.id}"><div class="sh"><small>${String(i + 1).padStart(2, "0")}</small><h3>${esc(s.label)}</h3></div>${s.blocks.map(block).join("")}</section>`).join("") +
      `<div style="margin-top:40px;display:flex;gap:10px;flex-wrap:wrap">${nextLink(id)}<button class="btn" type="button" data-close>Back to the scroll</button></div>`;
    dz.hidden = false; document.body.style.overflow = "hidden"; paused = true;
    requestAnimationFrame(() => { dz.classList.add("show"); dScroll.scrollTop = 0; hydrate(dScroll); $(".d-close", dz).focus({ preventScroll: true }); });
    updDNav();
  }
  function nextLink(id) {
    const ids = ["exhaust", ...T.order]; const k = ids.indexOf(id);
    if (k >= 0 && k < ids.length - 1) { const n = proj(ids[k + 1]); return `<a class="btn solid" href="#${n.id}" data-open="${n.id}">Next: ${esc(n.title)} ${ICON.arrow}</a>`; }
    return "";
  }
  function closeDossier(fromPop) {
    if (!openId) return;
    const id = openId; openId = null;
    dz.classList.remove("show"); document.body.style.overflow = ""; paused = false;
    clearInterval(tachoTimer); stopTP();
    setTimeout(() => { if (!openId) { dz.hidden = true; dScroll.innerHTML = ""; } }, 600);
    if (!fromPop && location.hash) history.pushState({}, "", location.pathname + location.search);
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  dz.addEventListener("click", (e) => {
    if (e.target.closest("[data-close]") || e.target.classList.contains("scrim")) { closeDossier(false); return; }
    const a = e.target.closest("[data-sec]");
    if (a) { e.preventDefault(); const t = $("#d-" + a.dataset.sec, dScroll); if (t) dScroll.scrollTo({ top: t.offsetTop - 8, behavior: reduced ? "auto" : "smooth" }); }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { if ($(".lightbox")) { $(".lightbox").remove(); return; } if (openId) closeDossier(false); }
    if (e.key === "Tab" && openId) { // focus trap
      const f = $$('a[href], button:not([disabled]), input, textarea, [tabindex="0"]', $(".sheet", dz)).filter((x) => x.offsetParent !== null);
      if (!f.length) return; const first = f[0], lastF = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); lastF.focus(); } else if (!e.shiftKey && document.activeElement === lastF) { e.preventDefault(); first.focus(); }
    }
  });
  function updDNav() {
    const secs = $$(".d-sec", dScroll); const y = dScroll.scrollTop + 120; let k = 0;
    secs.forEach((s, i) => { if (s.offsetTop <= y) k = i; });
    $$("a", dNav).forEach((a, i) => a.classList.toggle("on", i === k));
    const on = $("a.on", dNav); if (on && dNav.scrollWidth > dNav.clientWidth) dNav.scrollTo({ left: on.offsetLeft - 20, behavior: "auto" });
    const m = dScroll.scrollHeight - dScroll.clientHeight; $("#d-prog").style.width = (m > 0 ? (dScroll.scrollTop / m) * 100 : 0) + "%";
  }
  dScroll.addEventListener("scroll", updDNav, { passive: true });
  function routeFromHash(fromPop) {
    const id = decodeURIComponent(location.hash.slice(1));
    if (id && findDossier(id)) { openDossier(id, false); return; }
    if (openId) closeDossier(true);
    if (id && !fromPop) { setTimeout(() => jump(id.replace(/-ch$/, "")), 60); }
  }
  window.addEventListener("popstate", () => routeFromHash(true));
  window.addEventListener("hashchange", () => routeFromHash(true));

  /* =================== BLOCK RENDERERS =================== */
  const ncol = (n) => (n <= 4 ? n : n % 3 === 0 ? 3 : 4);
  function block(b) {
    switch (b.type) {
      case "lead": return `<p class="blk lead">${esc(b.text)}</p>`;
      case "p": return `<p class="blk">${esc(b.text)}</p>`;
      case "h": return `<p class="blk h">${esc(b.text)}</p>`;
      case "subhead": return `<p class="blk subhead">${esc(b.text)}</p>`;
      case "list": return `<ul class="blk list">${b.items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>`;
      case "stats": return `<div class="blk stats" style="--cols:${ncol(b.items.length)}">${b.items.map((s) => `<div><small>${esc(s[0])}</small><b>${esc(s[1])}</b>${s[2] ? `<span>${esc(s[2])}</span>` : ""}</div>`).join("")}</div>`;
      case "kv": return `<dl class="blk kv">${b.items.map((k) => `<dt>${esc(k[0])}</dt><dd>${esc(k[1])}</dd>`).join("")}</dl>`;
      case "figure": return `<figure class="blk ${b.plate ? "plate" : ""} ${b.transparent ? "transparent" : ""}"><img src="${b.src}" alt="${esc(b.alt)}" loading="lazy" data-zoom><figcaption>${esc(b.caption)}</figcaption></figure>`;
      case "gallery": return `<div class="blk gallery">${b.items.map((g) => `<figure class="${g.plate ? "plate" : ""}"><img src="${g.src}" alt="${esc(g.alt)}" loading="lazy" data-zoom><figcaption>${esc(g.caption)}</figcaption></figure>`).join("")}</div>`;
      case "cards": return `<div class="blk cards" style="--cols:${ncol(b.items.length)}">${b.items.map((c) => `<div><b>${esc(c[0])}</b><p>${esc(c[1])}</p></div>`).join("")}</div>`;
      case "callout": return `<div class="blk callout">${b.title ? `<b>${esc(b.title)}</b>` : ""}<p>${esc(b.text)}</p></div>`;
      case "eq": return `<div class="blk eq"><b>${esc(b.title)}</b><pre>${b.lines.map((l, i) => i === b.lines.length - 1 && b.lines.length > 1 ? `<span class="last">${esc(l)}</span>` : esc(l)).join("\n")}</pre>${b.note ? `<p>${esc(b.note)}</p>` : ""}</div>`;
      case "table": return `<div class="blk tbl">${b.title ? `<div class="tt">${esc(b.title)}</div>` : ""}<table>${b.head.some((h) => h) ? `<thead><tr>${b.head.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead>` : ""}<tbody>${b.rows.map((r, i) => `<tr class="${b.highlightRow === i ? "hi" : ""}">${r.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>${b.note ? `<div class="tn">${esc(b.note)}</div>` : ""}</div>`;
      case "versus": return `<div class="blk versus">${b.items.map((v) => `<div class="${v.selected ? "sel" : ""}"><small>${esc(v.tag)}</small><b>${esc(v.title)}</b>${v.diagram ? manifoldSVG(v.diagram) : ""}<p>${esc(v.text)}</p></div>`).join("")}</div>`;
      case "steps": return `<ol class="blk steps">${b.items.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>`;
      case "chips": return `<div class="blk chipsrow">${b.items.map((c) => `<span>${esc(c)}</span>`).join("")}</div>`;
      case "compare": return `<div class="blk cmpw"><div class="tabs" role="tablist">${b.tabs.map((t, i) => `<button role="tab" aria-selected="${i === 0}" data-cmp="${i}">${esc(t.label)}</button>`).join("")}</div>${b.tabs.map((t, i) => `<div class="cmp-pane" ${i ? "hidden" : ""}><div class="cmp"><figure class="sel"><img src="${t.a[0]}" alt="${esc(t.a[1])}" loading="lazy" data-zoom><figcaption>4-2-1 · selected</figcaption></figure><figure><img src="${t.b[0]}" alt="${esc(t.b[1])}" loading="lazy" data-zoom><figcaption>4-1 · candidate</figcaption></figure></div><p style="margin-top:12px;color:var(--ink-2)">${esc(t.text)}</p></div>`).join("")}</div>`;
      case "stages": return `<div class="blk stages">${b.items.map((s, i) => `<div class="stage ${s.final ? "final" : ""}"><small>Stage ${i + 1}${s.final ? " · selected" : ""}</small><b>${esc(s.title)}</b>${s.xray ? `<div class="xray" tabindex="0" aria-label="${esc(s.title)}: move the pointer over the render, or tap, to see inside"><img src="${s.xray.shell}" alt="${esc(s.title)} outer shell" loading="lazy"><div class="inner"><img src="${s.xray.inner}" alt="${esc(s.title)} internal structure" loading="lazy"></div><span class="hint">X-ray: hover / tap</span></div>` : ""}<ul class="plus">${s.plus.map((x) => `<li>${esc(x)}</li>`).join("")}</ul><ul class="minus">${s.minus.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>${s.xray ? `<div class="xray-kv">${s.xray.kv.map((k) => `<div><span class="mono" style="font-size:10px;letter-spacing:.12em;text-transform:uppercase">${esc(k[0])}</span><b>${esc(k[1])}</b><span>${esc(k[2])}</span></div>`).join("")}</div>` : ""}<div class="nx">${esc(s.next)}</div></div>`).join("")}</div>`;
      case "hotspots": return `<div class="blk"><div class="hotspots"><img src="${b.src}" alt="${esc(b.alt)}" loading="lazy">${b.spots.map((s, i) => `<button class="spot" type="button" style="left:${s[0]}%;top:${s[1]}%" data-hs="${i}" aria-label="${esc(s[2])}"></button>`).join("")}<span class="lbl" hidden></span></div><div class="hs-list">${b.spots.map((s, i) => `<button type="button" data-hs="${i}">${esc(s[2])}</button>`).join("")}</div></div>`;
      case "zones": return `<div class="blk zones" style="--cols:${b.items.length === 4 ? 2 : ncol(b.items.length)}">${b.items.map((z) => `<div class="${({ Critical: "crit", High: "high", Low: "low" })[z[0]] || ""}"><small>${esc(z[0])}</small><b>${esc(z[1])}</b><p>${esc(z[2])}</p>${z[3] ? `<div class="m">${esc(z[3])}${z[4] ? " · " + esc(z[4]) : ""}</div>` : ""}</div>`).join("")}</div>`;
      case "two": return `<div class="blk two">${[b.a, b.b].map((c) => `<div><h5>${esc(c.title)}</h5><ul>${c.list.map((l) => `<li>${esc(l)}</li>`).join("")}</ul></div>`).join("")}</div>`;
      case "process": return `<div class="blk process">${b.items.map((p, i) => `<div><small>0${i + 1}</small><b>${esc(p[0])}</b><p>${esc(p[1])}</p></div>`).join("")}</div>`;
      case "matrix": return matrixHTML(b);
      case "raw": return b.html;
      case "pair2": return `<div class="blk pair2">${[b.a, b.b].map((f) => `<figure><img src="${f.src}" alt="${esc(f.alt)}" loading="lazy" data-zoom><figcaption>${esc(f.caption)}</figcaption></figure>`).join("")}</div>`;
      case "pending": return `<div class="blk pending">${esc(b.text)}</div>`;
      case "refs": return `<p class="blk subhead">References</p><ol class="refs">${b.items.map((r) => `<li>${r[1] ? `<a href="${r[1]}" target="_blank" rel="noopener">${esc(r[0])}</a>` : esc(r[0])}</li>`).join("")}</ol>`;
      case "pidpicker": return `<div class="blk pid" data-pid='${esc(JSON.stringify(b.items))}'><div class="tabs" role="tablist">${b.items.map((c, i) => `<button role="tab" aria-selected="${i === 2}" data-pi="${i}">${esc(c.label)}</button>`).join("")}</div><div class="pid-body"></div></div>`;
      case "quotes": return `<div class="blk quotes">${b.items.map((q) => `<blockquote>${esc(q)}</blockquote>`).join("")}</div>`;
      case "imgcards": return `<div class="blk imgcards" style="--cols:${ncol(b.items.length)}">${b.items.map((c) => `<figure><img src="${c[0]}" alt="${esc(c[1])}" loading="lazy" data-zoom><figcaption><b>${esc(c[2])}</b>${esc(c[3])}</figcaption></figure>`).join("")}</div>`;
      case "week0": return `<div class="blk w0">${b.items.map((w) => `<div><small>${esc(w[0])}</small><b>${esc(w[1])}</b><p>${esc(w[2])}</p><div class="nums">${w[3].map((n) => `<span><b>${esc(n[0])}</b>${esc(n[1])}</span>`).join("")}</div></div>`).join("")}</div>`;
      case "award": return `<div class="blk award"><div><p class="eyebrow">${esc(b.d.year)}</p><h3 style="font-size:34px;margin-bottom:10px">${esc(b.d.title)}</h3><p style="color:var(--ink-2)">${esc(b.d.text)}</p><div class="blk stats" style="margin:0">${b.d.stats.map((s) => `<div><small>${esc(s[1])}</small><b>${esc(s[0])}</b></div>`).join("")}</div></div><img src="${b.d.img}" alt="${esc(b.d.alt)}" loading="lazy" data-zoom></div>`;
      case "diagram": return `<figure class="blk"><div class="chart diag" data-diag="${b.kind}">${diagramSVG(b.kind)}</div><figcaption>${esc(b.caption)}</figcaption></figure>`;
      case "tachopov": return tachopovHTML();
      case "chart": return `<div class="blk chart" data-chart='${esc(JSON.stringify(b))}'></div>`;
      default: return "";
    }
  }

  function matrixHTML(b) {
    const keys = Object.keys(b.rows);
    return `<div class="blk tbl"><div class="tt">Decision matrix: material property prioritisation</div><table><thead><tr><th>Property</th>${b.criteria.map((c) => `<th style="white-space:normal;min-width:70px">${esc(c)}</th>`).join("")}</tr></thead><tbody>${keys.map((k) => `<tr><td style="font-weight:500">${esc(k)}</td>${b.rows[k].map((v) => `<td style="text-align:center">${v ? '<span style="color:var(--acc);font-weight:700">✓</span>' : '<span style="color:var(--ink-3)">·</span>'}</td>`).join("")}</tr>`).join("")}<tr class="hi"><td>Weight</td>${b.weight.map((w) => `<td style="text-align:center;font-family:var(--f-mono)">${w}</td>`).join("")}</tr></tbody></table><div class="tn">${esc(b.note)}</div></div>`;
  }

  function manifoldSVG(kind) {
    const tops = [30, 70, 110, 150].map((x) => `<line x1="${x}" y1="10" x2="${x}" y2="45" stroke="currentColor" stroke-opacity=".55" stroke-width="5" stroke-linecap="round"/>`).join("");
    if (kind === "m41") return `<svg viewBox="0 0 180 140" role="img" aria-label="4-1 manifold: four primaries into one collector">${tops}<path d="M30 45 Q40 80 90 95 M70 45 Q75 80 90 95 M110 45 Q105 80 90 95 M150 45 Q140 80 90 95" fill="none" stroke="currentColor" stroke-opacity=".55" stroke-width="5" stroke-linecap="round"/><line x1="90" y1="95" x2="90" y2="132" style="stroke:var(--acc)" stroke-width="7" stroke-linecap="round"/></svg>`;
    return `<svg viewBox="0 0 180 140" role="img" aria-label="4-2-1 manifold: pairs merge into two secondaries then one">${tops}<path d="M30 45 Q35 70 50 78 M70 45 Q65 70 50 78 M110 45 Q115 70 130 78 M150 45 Q145 70 130 78" fill="none" stroke="currentColor" stroke-opacity=".55" stroke-width="5" stroke-linecap="round"/><path d="M50 78 Q55 100 90 108 M130 78 Q125 100 90 108" fill="none" style="stroke:var(--acc2)" stroke-width="6" stroke-linecap="round"/><line x1="90" y1="108" x2="90" y2="134" style="stroke:var(--acc)" stroke-width="7" stroke-linecap="round"/></svg>`;
  }

  function diagramSVG(kind) {
    if (kind === "pulse") {
      const rows = [[1, 0], [2, 1], [4, 2], [3, 3]];
      return `<svg viewBox="0 0 420 220" role="img" aria-label="Animated exhaust pulse timing for firing order 1-2-4-3">${[0, 180, 360, 540, 720].map((d, i) => `<line x1="${80 + i * 80}" y1="22" x2="${80 + i * 80}" y2="200" stroke="currentColor" style="stroke:var(--line)"/><text x="${80 + i * 80}" y="16" text-anchor="middle">${d}°</text>`).join("")}${rows.map(([c, o], i) => { const y = 50 + i * 42; return `<text x="12" y="${y + 4}" class="lbl-strong">Cyl ${c}</text><line x1="80" y1="${y}" x2="400" y2="${y}" style="stroke:var(--line-2)" stroke-width="2"/><rect x="${80 + o * 80}" y="${y - 7}" width="80" height="14" rx="3" style="fill:var(--acc)" opacity=".18"/><circle cx="80" cy="${y}" r="7" style="fill:${i % 2 ? "var(--acc2)" : "var(--acc)"}"><animate attributeName="cx" values="80;400" dur="4s" begin="${-o}s" repeatCount="indefinite"/><animate attributeName="r" values="9;5;5;5" dur="4s" begin="${-o}s" repeatCount="indefinite"/></circle>`; }).join("")}<text x="80" y="214">Firing order 1-2-4-3 · 180° between events</text></svg>`;
    }
    if (kind === "tacho") {
      const ticks = Array.from({ length: 11 }, (_, i) => { const a = (-220 + i * 26) * Math.PI / 180; return `<line x1="${100 + Math.cos(a) * 76}" y1="${100 + Math.sin(a) * 76}" x2="${100 + Math.cos(a) * 88}" y2="${100 + Math.sin(a) * 88}" style="stroke:var(--ink-3)" stroke-width="1.5"/><text x="${100 + Math.cos(a) * 66}" y="${103 + Math.sin(a) * 66}" text-anchor="middle" style="font-size:8px">${i * 2}</text>`; }).join("");
      return `<svg viewBox="0 0 200 180" style="max-width:320px;margin:0 auto" role="img" aria-label="Tachometer oscillating between 7,600 and 8,000 rpm">${ticks}<path d="M 31 141 A 88 88 0 1 1 169 141" fill="none" style="stroke:var(--line-2)" stroke-width="2"/><path d="M 140 37 A 88 88 0 0 1 169 141" fill="none" style="stroke:var(--acc)" stroke-width="6" stroke-linecap="round"/><g transform="translate(100 100)"><line id="needle" x1="0" y1="0" x2="0" y2="-70" style="stroke:var(--acc)" stroke-width="2.5" stroke-linecap="round" transform="rotate(-26)"/></g><circle cx="100" cy="100" r="5" style="fill:var(--acc)"/><text x="100" y="138" text-anchor="middle" class="lbl-strong" style="font:700 20px var(--f-display);fill:var(--ink)" id="rpm">8000</text><text x="100" y="152" text-anchor="middle">rpm</text><text x="100" y="172" text-anchor="middle">dial ×1000 · simulation point</text></svg>`;
    }
    if (kind === "pca") {
      const box = (x, w, t, s, hl) => `<rect x="${x}" y="40" width="${w}" height="70" rx="14" style="fill:${hl ? "var(--acc)" : "var(--panel-solid)"};stroke:var(--line-2)"/><text x="${x + w / 2}" y="72" text-anchor="middle" style="font:700 18px var(--f-display);fill:${hl ? "#fff" : "var(--ink)"}">${t}</text><text x="${x + w / 2}" y="94" text-anchor="middle" style="font:500 11px var(--f-mono);fill:${hl ? "#fff" : "var(--ink-3)"}">${s}</text>`;
      const ar = (x) => `<path d="M${x} 75 h18" style="stroke:var(--ink-3)" stroke-width="1.5" marker-end="url(#pa)"/>`;
      return `<svg viewBox="0 0 640 150" role="img" aria-label="PCA pipeline from 37 features to a taxi-time prediction"><defs><marker id="pa" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" style="fill:var(--ink-3)"/></marker></defs>${box(0, 96, "37", "features")}${ar(100)}${box(122, 110, "PCA", "rank significance")}${ar(236)}${box(258, 96, "29", "features kept")}${ar(358)}${box(380, 96, "4", "components")}${ar(480)}${box(502, 136, "FIS", "taxi-time output", 1)}<text x="0" y="140" style="font:500 11px var(--f-mono);fill:var(--ink-3)">Outliers and anomalies removed before training · RMSE used to evaluate</text></svg>`;
    }
    if (kind === "cmesh") {
      return `<svg viewBox="0 0 640 230" role="img" aria-label="C-mesh domain schematic around the slotted aerofoil"><path d="M 250 30 A 85 85 0 0 0 250 200 L 620 200 L 620 30 Z" fill="none" style="stroke:var(--acc)" stroke-width="1.5" stroke-dasharray="5 4"/>${Array.from({ length: 9 }, (_, i) => `<path d="M ${250 + i * 0} ${115 - (85 - i * 9)} A ${85 - i * 9} ${85 - i * 9} 0 0 0 ${250} ${115 + 85 - i * 9}" fill="none" style="stroke:var(--line-2)"/>`).join("")}${Array.from({ length: 12 }, (_, i) => `<line x1="${290 + i * 28}" y1="30" x2="${290 + i * 28}" y2="200" style="stroke:var(--line)"/>`).join("")}<path d="M 235 112 C 250 98, 300 96, 345 108 C 330 116, 270 120, 235 112 Z" style="fill:var(--acc)" opacity=".9"/><path d="M 350 114 C 360 112, 378 118, 392 128 C 378 126, 360 122, 350 116 Z" style="fill:var(--acc2)"/><text x="160" y="118" text-anchor="middle">Inlet · 20c</text><text x="610" y="118" text-anchor="end">Outlet · 40c</text><text x="430" y="24" text-anchor="middle">Slip / symmetry farfield</text><text x="300" y="150" text-anchor="middle" class="lbl-strong">Main + flap · AoA 5°</text><line x1="40" y1="200" x2="120" y2="200" style="stroke:var(--ink-3)" marker-end="url(#ah)"/><defs><marker id="ah" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" style="fill:var(--ink-3)"/></marker></defs><text x="40" y="192">U∞ = 25 m/s</text></svg>`;
    }
    if (kind === "axe") {
      return `<svg viewBox="0 0 640 300" role="img" aria-label="Ice axe schematic with fixed grip edge, pressure load at the pick face and the critical neck curvature"><defs><radialGradient id="vm" cx="0.5" cy="0.5" r="0.5"><stop offset="0" style="stop-color:var(--acc2)"/><stop offset="1" style="stop-color:var(--acc2)" stop-opacity="0"/></radialGradient></defs><path d="M 330 270 L 318 140 Q 316 90 330 62 Q 300 58 250 66 Q 190 80 150 110 L 156 116 Q 200 92 252 82 Q 298 76 322 80 Q 312 110 314 140 L 326 270 Z" style="fill:var(--acc)" opacity=".35"/><path d="M 330 62 Q 370 56 400 62 L 398 72 Q 370 68 336 74 Z" style="fill:var(--acc)" opacity=".35"/><circle cx="322" cy="84" r="26" fill="url(#vm)" opacity=".8"/><path d="M 318 270 L 360 280" style="stroke:var(--acc)" stroke-width="6" stroke-linecap="round" opacity=".5"/>${Array.from({ length: 7 }, (_, i) => `<line x1="${312 + i * 7}" y1="276" x2="${306 + i * 7}" y2="286" style="stroke:var(--ink-2)"/>`).join("")}<line x1="300" y1="272" x2="366" y2="282" style="stroke:var(--ink)" stroke-width="2"/>${[0, 1, 2].map((i) => `<line x1="${140 + i * 8}" y1="${70 + i * 6}" x2="${152 + i * 8}" y2="${104 + i * 6}" style="stroke:var(--crit)" stroke-width="2" marker-end="url(#ah2)"/>`).join("")}<defs><marker id="ah2" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" style="fill:var(--crit)"/></marker></defs><text x="70" y="60" class="lbl-strong">Pressure 0.95375 MPa</text><text x="70" y="74">pick face · 30 × 24 mm</text><text x="380" y="292" class="lbl-strong">Fixed BC: lower grip edge</text><text x="360" y="110" class="lbl-strong">Critical: inner neck curvature</text><text x="360" y="124">r = 10.91 mm · θ = 75.11°</text><text x="470" y="200">Beech plywood · E = 8 GPa</text><text x="470" y="214">ν = 0.3 · UTS = 70 MPa · t = 24 mm</text></svg>`;
    }
    if (kind === "loop") {
      const box = (x, y, w, t, s) => `<rect x="${x}" y="${y}" width="${w}" height="44" rx="6" style="fill:var(--panel-solid);stroke:${s || "var(--line-2)"}" stroke-width="1.5"/><text x="${x + w / 2}" y="${y + 27}" text-anchor="middle" class="lbl-strong">${t}</text>`;
      return `<svg viewBox="0 0 640 170" role="img" aria-label="Closed-loop block diagram">${box(10, 40, 90, "Setpoint 6 cm")}<circle cx="140" cy="62" r="14" style="fill:none;stroke:var(--ink-2)" stroke-width="1.5"/><text x="140" y="67" text-anchor="middle" class="lbl-strong">Σ</text>${box(190, 40, 120, "PID  Kp·Ki·Kd", "var(--acc)")}${box(350, 40, 100, "Pump 2")}${box(490, 40, 130, "Tank  dV/dt = F − K√V")}<g style="stroke:var(--ink-2)" stroke-width="1.5" fill="none"><path d="M100 62 H126" marker-end="url(#ah3)"/><path d="M154 62 H190" marker-end="url(#ah3)"/><path d="M310 62 H350" marker-end="url(#ah3)"/><path d="M450 62 H490" marker-end="url(#ah3)"/><path d="M620 62 H632 V130 H140 V76" marker-end="url(#ah3)"/></g><defs><marker id="ah3" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" style="fill:var(--ink-2)"/></marker></defs><rect x="330" y="116" width="150" height="28" rx="6" style="fill:var(--page);stroke:var(--line-2)"/><text x="405" y="134" text-anchor="middle">Level transmitter (LT)</text><text x="130" y="96">−</text><text x="118" y="54">+</text><text x="160" y="56">e(t)</text><text x="318" y="54">u(t)</text></svg>`;
    }
    if (kind === "layup") {
      const ply = (y, ang, lab) => { const lines = Array.from({ length: 26 }, (_, i) => { const x = 40 + i * 20; const dx = ang === 90 ? 0 : ang === 0 ? 30 : ang > 0 ? 12 : -12; return ang === 0 ? `<line x1="40" y1="${y + 4 + (i % 4) * 5}" x2="560" y2="${y + 4 + (i % 4) * 5}"/>` : `<line x1="${x}" y1="${y}" x2="${x + dx}" y2="${y + 22}"/>`; }).join(""); return `<g style="stroke:var(--acc)" stroke-width="1.2" opacity=".75"><rect x="40" y="${y}" width="520" height="22" style="fill:var(--panel-solid);stroke:var(--line-2)"/>${lines}</g><text x="572" y="${y + 15}">${lab}</text>`; };
      return `<svg viewBox="0 0 640 210" role="img" aria-label="Layup: PTFE skin over 0, ±45 and 90 degree S-glass plies"><rect x="40" y="16" width="520" height="12" rx="2" style="fill:var(--acc2)" opacity=".7"/><text x="572" y="26" class="lbl-strong">PTFE skin</text>${ply(36, 0, "0° ply")}${ply(64, 45, "+45° ply")}${ply(92, -45, "−45° ply")}${ply(120, 90, "90° ply")}<rect x="40" y="150" width="520" height="12" rx="2" style="fill:var(--acc2)" opacity=".7"/><text x="572" y="160" class="lbl-strong">PTFE skin</text><text x="40" y="186">Epoxy S-glass fibre, UD prepreg · ρ 1.91 Mg/m³ · E 47.7 GPa</text><text x="40" y="202">Autoclave cure · total component mass 0.71 kg</text></svg>`;
    }
    return "";
  }

  /* =================== HYDRATE INTERACTIVES =================== */
  function hydrate(root) {
    $$("[data-chart]", root).forEach((el) => { try { drawChart(el, JSON.parse(el.dataset.chart)); } catch (e) { console.warn(e); } });
    $$(".cmpw", root).forEach((w) => w.addEventListener("click", (e) => { const b = e.target.closest("[data-cmp]"); if (!b) return; const i = +b.dataset.cmp; $$("[data-cmp]", w).forEach((x) => x.setAttribute("aria-selected", String(+x.dataset.cmp === i))); $$(".cmp-pane", w).forEach((p, k) => (p.hidden = k !== i)); }));
    $$(".xray", root).forEach((x) => {
      const inner = $(".inner", x); let locked = false;
      const at = (e) => { const r = x.getBoundingClientRect(); inner.style.clipPath = `circle(${Math.max(r.width, r.height) * 0.22}px at ${e.clientX - r.left}px ${e.clientY - r.top}px)`; };
      x.addEventListener("pointermove", (e) => { if (e.pointerType === "mouse" && !locked) at(e); });
      x.addEventListener("pointerleave", () => { if (!locked) inner.style.clipPath = "circle(0px at 50% 50%)"; });
      const toggle = () => { locked = !locked; inner.style.clipPath = locked ? "circle(150% at 50% 50%)" : "circle(0px at 50% 50%)"; };
      x.addEventListener("click", toggle); x.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } });
    });
    $$(".hotspots", root).forEach((h) => {
      const wrap = h.parentElement, lbl = $(".lbl", h), spots = $$(".spot", h);
      const show = (i) => { $$("[data-hs]", wrap).forEach((b) => b.classList.toggle("on", +b.dataset.hs === i)); if (i < 0) { lbl.hidden = true; return; } const s = spots[i]; lbl.hidden = false; lbl.textContent = s.getAttribute("aria-label"); lbl.style.left = s.style.left; lbl.style.top = s.style.top; };
      wrap.addEventListener("pointerover", (e) => { const b = e.target.closest("[data-hs]"); if (b) show(+b.dataset.hs); });
      wrap.addEventListener("focusin", (e) => { const b = e.target.closest("[data-hs]"); if (b) show(+b.dataset.hs); });
      wrap.addEventListener("pointerleave", () => show(-1));
      h.addEventListener("pointermove", (e) => { if (reduced) return; const r = h.getBoundingClientRect(); const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5; $("img", h).style.transform = `perspective(900px) rotateY(${px * 6}deg) rotateX(${-py * 6}deg)`; });
      h.addEventListener("pointerleave", () => { $("img", h).style.transform = ""; });
      $("img", h).style.transition = "transform .4s var(--ease)";
    });
    $$("[data-pid]", root).forEach((w) => {
      const items = JSON.parse(w.dataset.pid), body = $(".pid-body", w);
      const show = (i) => { const c = items[i]; $$("[data-pi]", w).forEach((b) => b.setAttribute("aria-selected", String(+b.dataset.pi === i)));
        body.innerHTML = c.unstable ? `<div class="pid-warn"><b>Unstable · not used</b>Kp = ${c.kp}, Ki = ${c.ki}, Kd = ${c.kd}. ${esc(c.note)}</div>` :
          `<div class="pid-out"><div><small>Gains</small><b style="font-size:18px">Kp ${c.kp} · Ki ${c.ki} · Kd ${c.kd}</b></div><div><small>Rise time</small><b>${c.rise} s</b></div><div><small>Settling time</small><b style="${c.best ? "color:var(--acc)" : ""}">${c.settle} s</b></div><div><small>Peak (LT)</small><b>${c.peak} V</b></div><div><small>Overshoot</small><b>${c.os}%</b></div></div><p style="margin-top:10px;color:var(--ink-2)">${esc(c.note)}</p>`; };
      w.addEventListener("click", (e) => { const b = e.target.closest("[data-pi]"); if (b) show(+b.dataset.pi); });
      show(2);
    });
    startTP(root);
    const needle = $("#needle", root), rpm = $("#rpm", root);
    if (needle) { const t0 = performance.now(); clearInterval(tachoTimer); tachoTimer = setInterval(() => { const c = ((performance.now() - t0) % 3000) / 3000; const v = 7600 + (Math.sin(c * Math.PI * 2) * 0.5 + 0.5) * 400; rpm.textContent = Math.round(v / 100) * 100; needle.setAttribute("transform", `rotate(${(-130 + (v / 2000) * 26).toFixed(2)})`); }, reduced ? 1000 : 60); }
  }

  /* lightbox */
  document.addEventListener("click", (e) => {
    const img = e.target.closest("img[data-zoom]"); if (!img) { const lb = e.target.closest(".lightbox"); if (lb) lb.remove(); return; }
    const lb = document.createElement("div"); lb.className = "lightbox"; lb.setAttribute("role", "dialog"); lb.setAttribute("aria-label", img.alt);
    lb.innerHTML = `<div><img src="${img.src}" alt="${esc(img.alt)}"><p>${esc(img.alt)} · click or Esc to close</p></div>`; document.body.appendChild(lb);
  });

  /* =================== CHARTS =================== */
  const SER = ["var(--s1)", "var(--s2)", "var(--s3)", "var(--s4)"];
  function niceTicks(lo, hi, n) { const span = hi - lo, step0 = span / n, mag = Math.pow(10, Math.floor(Math.log10(step0))); const st = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => span / s <= n) || mag * 10; const out = []; for (let v = Math.ceil(lo / st) * st; v <= hi + 1e-9; v += st) out.push(+v.toFixed(10)); return out; }
  const fmtK = (v) => (v >= 1000 ? (v / 1000).toFixed(v >= 10000 ? 0 : 1).replace(/\.0$/, "") + "k" : String(v));

  function drawChart(el, c) {
    if (c.kind === "line") return lineChart(el, c);
    if (c.kind === "bars") return barChart(el, c);
    if (c.kind === "hbar") return hbarChart(el, c);
    if (c.kind === "ashby") return ashbyChart(el, c);
    if (c.kind === "ashbyMini") return ashbyMini(el, c);
    if (c.kind === "weekly") return weeklyChart(el);
    if (c.kind === "pair") return pairChart(el, c);
    if (c.kind === "conv") return convChart(el, c);
  }
  function frameHTML(c, inner, legend) { return `<div class="ct">${esc(c.title || "")}</div>${c.note ? `<div class="cn">${esc(c.note)}</div>` : ""}${inner}${legend || ""}<div class="tip"></div>`; }

  function lineChart(el, c) {
    const W = 640, H = 300, m = { l: 56, r: 18, t: 14, b: 44 };
    let series = c.series;
    if (c.fn) series = series.map((s) => ({ name: s.name, pts: Array.from({ length: 91 }, (_, i) => [i * 10, 1 - Math.exp(-(i * 10) / s.tau)]) }));
    const xs = series.flatMap((s) => s.pts.map((p) => p[0]));
    const logX = !!c.xk || /cells/i.test(c.xLabel);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), [y0, y1] = c.yDomain;
    const X = logX ? (v) => m.l + (Math.log10(v) - Math.log10(x0)) / (Math.log10(x1) - Math.log10(x0)) * (W - m.l - m.r) : (v) => m.l + (v - x0) / (x1 - x0) * (W - m.l - m.r);
    const Y = (v) => H - m.b - (v - y0) / (y1 - y0) * (H - m.t - m.b);
    const yt = niceTicks(y0, y1, 5);
    const xt = logX ? [1, 10, 100, 1e3, 1e4, 1e5, 1e6].filter((v) => v >= x0 * 0.999 && v <= x1 * 1.001).concat(x0 > 1 && x0 < 10 ? [x0] : []) : niceTicks(x0, x1, 6);
    let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(c.title)}"><g class="grid">${yt.map((v) => `<line x1="${m.l}" x2="${W - m.r}" y1="${Y(v)}" y2="${Y(v)}"/>`).join("")}</g>`;
    s += `<g class="axis"><line x1="${m.l}" x2="${W - m.r}" y1="${H - m.b}" y2="${H - m.b}"/></g>`;
    s += yt.map((v) => `<text x="${m.l - 8}" y="${Y(v) + 4}" text-anchor="end">${v.toFixed(c.fmt > 2 ? 2 : c.fmt)}</text>`).join("");
    s += xt.map((v) => `<text x="${X(v)}" y="${H - m.b + 18}" text-anchor="middle">${fmtK(v)}</text>`).join("");
    s += `<text x="${(W + m.l) / 2}" y="${H - 6}" text-anchor="middle">${esc(c.xLabel)}${logX ? " · log scale" : ""}</text><text transform="translate(14 ${(H - m.b + m.t) / 2}) rotate(-90)" text-anchor="middle">${esc(c.yLabel)}</text>`;
    series.forEach((se, i) => { const d = se.pts.map((p, k) => `${k ? "L" : "M"}${X(p[0]).toFixed(1)},${Y(p[1]).toFixed(1)}`).join(" "); s += `<path d="${d}" fill="none" style="stroke:${SER[i]}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`; if (!c.fn) s += se.pts.map((p) => `<circle cx="${X(p[0])}" cy="${Y(p[1])}" r="3.2" style="fill:${SER[i]};stroke:var(--panel-solid)" stroke-width="1.5"/>`).join(""); const lp = se.pts[se.pts.length - 1]; if (series.length <= 4 && !c.fn) s += ""; });
    s += `<line class="xh" x1="0" x2="0" y1="${m.t}" y2="${H - m.b}" style="stroke:var(--ink-3)" stroke-dasharray="3 3" opacity="0"/><rect x="${m.l}" y="${m.t}" width="${W - m.l - m.r}" height="${H - m.t - m.b}" fill="transparent" class="hit"/></svg>`;
    const legend = `<div class="legend">${series.map((se, i) => `<span><i style="background:${SER[i]}"></i>${esc(se.name)}</span>`).join("")}</div>`;
    el.innerHTML = frameHTML(c, s, legend);
    const svg = $("svg", el), tip = $(".tip", el), xh = $(".xh", el);
    const allX = [...new Set(series.flatMap((se) => se.pts.map((p) => p[0])))].sort((a, b) => a - b);
    $(".hit", el).addEventListener("pointermove", (e) => {
      const r = svg.getBoundingClientRect(), sx = (e.clientX - r.left) * (W / r.width);
      let best = allX[0]; for (const v of allX) if (Math.abs(X(v) - sx) < Math.abs(X(best) - sx)) best = v;
      xh.setAttribute("x1", X(best)); xh.setAttribute("x2", X(best)); xh.setAttribute("opacity", 1);
      const rows = series.map((se, i) => { const p = se.pts.find((q) => q[0] === best); return p ? `<div><i style="background:${SER[i]}"></i>${esc(se.name)}: ${p[1].toFixed(c.fmt)}</div>` : ""; }).join("");
      tip.innerHTML = `<div style="opacity:.7">${esc(c.xLabel)}: ${best.toLocaleString("en-GB")}</div>${rows}`;
      const er = el.getBoundingClientRect(); let lx = e.clientX - er.left + 14; if (lx > er.width - 200) lx = e.clientX - er.left - 200; tip.style.left = lx + "px"; tip.style.top = (e.clientY - er.top - 10) + "px"; tip.style.opacity = 1;
    });
    $(".hit", el).addEventListener("pointerleave", () => { tip.style.opacity = 0; xh.setAttribute("opacity", 0); });
  }

  function barChart(el, c) {
    const W = 640, H = 280, m = { l: 56, r: 14, t: 20, b: 40 };
    const vals = c.items.map((i) => i[1]); const lo = Math.min(0, ...vals), hi = Math.max(...vals);
    const yt = niceTicks(lo, hi * 1.08, 5), y0 = Math.min(lo, yt[0]), y1 = yt[yt.length - 1];
    const Y = (v) => H - m.b - (v - y0) / (y1 - y0) * (H - m.t - m.b);
    const n = c.items.length, bw = (W - m.l - m.r) / n;
    let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(c.title)}"><g class="grid">${yt.map((v) => `<line x1="${m.l}" x2="${W - m.r}" y1="${Y(v)}" y2="${Y(v)}"/>`).join("")}</g>`;
    s += yt.map((v) => `<text x="${m.l - 8}" y="${Y(v) + 4}" text-anchor="end">${v}</text>`).join("");
    s += `<text transform="translate(14 ${(H - m.b + m.t) / 2}) rotate(-90)" text-anchor="middle">${esc(c.unit)}</text>`;
    c.items.forEach((it, i) => { const x = m.l + i * bw + bw * 0.22, w = bw * 0.56, ya = Y(Math.max(0, it[1])), yb = Y(Math.min(0, it[1])); const h = Math.max(1, yb - ya);
      s += `<rect x="${x}" y="${ya}" width="${w}" height="${h}" rx="3" style="fill:var(--acc)" opacity="${it[1] < 0 ? 0.5 : 0.9}" data-i="${i}"/>`;
      s += `<text x="${x + w / 2}" y="${it[1] < 0 ? yb + 13 : ya - 6}" text-anchor="middle" class="lbl-strong">${it[1]}</text>`;
      s += `<text x="${x + w / 2}" y="${H - m.b + 18}" text-anchor="middle">${esc(it[0])}</text>`; });
    s += `<line x1="${m.l}" x2="${W - m.r}" y1="${Y(0)}" y2="${Y(0)}" style="stroke:var(--ink-3)"/></svg>`;
    el.innerHTML = frameHTML(c, s);
    const tip = $(".tip", el);
    $$("rect[data-i]", el).forEach((r) => { r.addEventListener("pointerenter", (e) => { const it = c.items[+r.dataset.i]; tip.innerHTML = `${esc(it[0])}: <b>${it[1]}</b> ${esc(c.unit)}`; tip.style.opacity = 1; const er = el.getBoundingClientRect(); tip.style.left = Math.min(er.width - 160, e.clientX - er.left + 10) + "px"; tip.style.top = (e.clientY - er.top - 30) + "px"; }); r.addEventListener("pointerleave", () => (tip.style.opacity = 0)); });
  }

  function hbarChart(el, c) {
    const W = 640, rowH = 46, H = c.items.length * rowH + 30, m = { l: 150, r: 90 };
    const max = Math.max(...c.items.map((i) => i[1])) * 1.05; const X = (v) => m.l + (v / max) * (W - m.l - m.r);
    let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(c.title)}">`;
    c.items.forEach((it, i) => { const y = 10 + i * rowH; const lo = it[3] || 0; s += `<text x="${m.l - 10}" y="${y + 18}" text-anchor="end" class="lbl-strong">${esc(it[0])}</text><rect x="${m.l}" y="${y + 8}" width="${X(max) - m.l}" height="14" rx="3" style="fill:var(--line)"/>`;
      if (lo) s += `<rect x="${X(lo)}" y="${y + 8}" width="${X(it[1]) - X(lo)}" height="14" rx="3" style="fill:var(--acc)"/><text x="${X(lo)}" y="${y + 38}" text-anchor="middle">${lo}</text><text x="${X(it[1])}" y="${y + 38}" text-anchor="middle">${it[1]}</text>`;
      else s += `<rect x="${m.l}" y="${y + 8}" width="${X(it[1]) - m.l}" height="14" rx="3" style="fill:var(--acc)" opacity=".5"/>`;
      s += `<text x="${W - m.r + 10}" y="${y + 19}" class="lbl-strong">${esc(it[2])}</text>`; });
    s += `</svg>`; el.innerHTML = frameHTML(c, s);
  }

  function ashbyChart(el, c) {
    const W = 640, H = 330, m = { l: 60, r: 20, t: 16, b: 46 };
    const lx0 = Math.log10(1), lx1 = Math.log10(3.2), ly0 = Math.log10(20), ly1 = Math.log10(250);
    const X = (v) => m.l + (Math.log10(v) - lx0) / (lx1 - lx0) * (W - m.l - m.r);
    const Y = (v) => H - m.b - (Math.log10(v) - ly0) / (ly1 - ly0) * (H - m.t - m.b);
    let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(c.title)}"><g class="grid">${[20, 50, 100, 200].map((v) => `<line x1="${m.l}" x2="${W - m.r}" y1="${Y(v)}" y2="${Y(v)}"/>`).join("")}${[1, 1.5, 2, 3].map((v) => `<line y1="${m.t}" y2="${H - m.b}" x1="${X(v)}" x2="${X(v)}"/>`).join("")}</g>`;
    s += [20, 50, 100, 200].map((v) => `<text x="${m.l - 8}" y="${Y(v) + 4}" text-anchor="end">${v}</text>`).join("") + [1, 1.5, 2, 3].map((v) => `<text x="${X(v)}" y="${H - m.b + 18}" text-anchor="middle">${v}</text>`).join("");
    s += `<text x="${(W + m.l) / 2}" y="${H - 6}" text-anchor="middle">Density ρ (Mg/m³) · log</text><text transform="translate(14 ${(H - m.b + m.t) / 2}) rotate(-90)" text-anchor="middle">Young's modulus E (GPa) · log</text>`;
    const sel = c.items.find((i) => i[3]); const k = Math.sqrt(sel[2]) / sel[1];
    const lp = (r) => [X(r), Y((k * r) ** 2)]; const [a1, b1] = lp(1.0), [a2, b2] = lp(2.3);
    s += `<line x1="${a1}" y1="${b1}" x2="${a2}" y2="${b2}" style="stroke:var(--acc2)" stroke-dasharray="6 4" stroke-width="1.5"/><text x="${a2 - 4}" y="${b2 - 8}" text-anchor="end">slope 2 · E¹ᐟ²/ρ = const</text>`;
    c.items.forEach((it) => { const x = X(it[1]), y = Y(it[2]); s += `<circle cx="${x}" cy="${y}" r="${it[3] ? 9 : 7}" style="fill:${it[3] ? "var(--acc)" : "var(--ink-3)"};stroke:var(--panel-solid)" stroke-width="2"/><text x="${x + 12}" y="${y + 4}" class="${it[3] ? "lbl-strong" : ""}">${esc(it[0])} (${it[1]}, ${it[2]})</text>`; });
    s += `</svg>`; el.innerHTML = frameHTML(c, s, `<div class="legend"><span><i style="background:var(--acc)"></i>Selected: Epoxy/S-glass fibre</span><span><i style="background:var(--ink-3)"></i>Candidates</span><span><i style="background:var(--acc2)"></i>Index guideline through the selected material</span></div>`);
  }

  function ashbyMini(el, c) {
    const panel = (p) => { const W = 300, H = 210; let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(p.title)}"><text x="10" y="14" class="lbl-strong">${esc(p.title)}</text><line x1="30" y1="185" x2="290" y2="185" style="stroke:var(--line-2)"/><line x1="30" y1="25" x2="30" y2="185" style="stroke:var(--line-2)"/><text x="160" y="204" text-anchor="middle">Density →</text>`;
      p.pts.forEach((q) => { const x = 30 + q[1] * 2.4, y = 185 - q[2] * 1.6; s += `<circle cx="${x}" cy="${y}" r="${q[3] ? 8 : 6}" style="fill:${q[3] ? "var(--acc)" : "var(--ink-3)"}"/><text x="${x + 11}" y="${y + 4}" class="${q[3] ? "lbl-strong" : ""}">${esc(q[0])}</text>`; });
      return s + "</svg>"; };
    el.innerHTML = frameHTML(c, `<div class="charts2">${c.panels.map(panel).join("")}</div>`);
  }

  function weeklyChart(el) {
    const O = D.organiser, W = 640, H = 300, m = { l: 44, r: 90, t: 16, b: 40 };
    const xs = O.weekly.map((w) => w[0]); const X = (i) => m.l + i / (xs.length - 1) * (W - m.l - m.r); const Y = (v) => H - m.b - v / 20 * (H - m.t - m.b);
    const ser = [["Total attendees", 1], ["Session 1", 2], ["Session 2", 3]];
    let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Weekly PASS attendance, Semester A"><g class="grid">${[0, 5, 10, 15, 20].map((v) => `<line x1="${m.l}" x2="${W - m.r}" y1="${Y(v)}" y2="${Y(v)}"/><text x="${m.l - 8}" y="${Y(v) + 4}" text-anchor="end">${v}</text>`).join("")}</g>`;
    s += xs.map((w, i) => `<text x="${X(i)}" y="${H - m.b + 18}" text-anchor="middle">${w}</text>`).join("");
    s += `<line x1="${m.l}" x2="${W - m.r}" y1="${Y(9.18)}" y2="${Y(9.18)}" style="stroke:var(--ink-3)" stroke-dasharray="4 4"/><text x="${W - m.r + 6}" y="${Y(9.18) + 4}">avg 9.18</text>`;
    ser.forEach(([n, k], i) => { s += `<path d="${O.weekly.map((w, j) => `${j ? "L" : "M"}${X(j)},${Y(w[k])}`).join(" ")}" fill="none" style="stroke:${SER[i]}" stroke-width="${i ? 2 : 2.5}" ${i ? 'stroke-dasharray="5 4"' : ""}/>` + O.weekly.map((w, j) => `<circle cx="${X(j)}" cy="${Y(w[k])}" r="${i ? 3 : 4.5}" style="fill:${SER[i]};stroke:var(--panel-solid)" stroke-width="1.5"/>`).join(""); });
    s += `<line class="xh" y1="${m.t}" y2="${H - m.b}" style="stroke:var(--ink-3)" stroke-dasharray="3 3" opacity="0"/><rect class="hit" x="${m.l}" y="${m.t}" width="${W - m.l - m.r}" height="${H - m.t - m.b}" fill="transparent"/></svg>`;
    el.innerHTML = frameHTML({ title: "Weekly attendance trends · Semester A 2025–26" }, s, `<div class="legend">${ser.map(([n], i) => `<span><i style="background:${SER[i]}"></i>${n}</span>`).join("")}<span><i style="background:var(--ink-3)"></i>Average 9.18</span></div>`);
    const svg = $("svg", el), tip = $(".tip", el), xh = $(".xh", el);
    $(".hit", el).addEventListener("pointermove", (e) => { const r = svg.getBoundingClientRect(), sx = (e.clientX - r.left) * (W / r.width); const j = Math.max(0, Math.min(xs.length - 1, Math.round((sx - m.l) / (W - m.l - m.r) * (xs.length - 1)))); const w = O.weekly[j]; xh.setAttribute("x1", X(j)); xh.setAttribute("x2", X(j)); xh.setAttribute("opacity", 1); tip.innerHTML = `<div style="opacity:.7">Week ${j + 1}${j === 6 ? " · SKEMP week" : ""}</div>${ser.map(([n, k], i) => `<div><i style="background:${SER[i]}"></i>${n}: ${w[k]}</div>`).join("")}`; const er = el.getBoundingClientRect(); let lx = e.clientX - er.left + 14; if (lx > er.width - 170) lx -= 190; tip.style.left = lx + "px"; tip.style.top = (e.clientY - er.top - 10) + "px"; tip.style.opacity = 1; });
    $(".hit", el).addEventListener("pointerleave", () => { tip.style.opacity = 0; xh.setAttribute("opacity", 0); });
  }

  function pairChart(el, c) {
    const W = 640, rowH = 74, H = c.items.length * rowH + 20, L = 190, R = 70;
    let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(c.title)}">`;
    c.items.forEach((it, i) => { const y = 14 + i * rowH, mx = Math.max(it[1], it[2]) * 1.1, X = (v) => L + (v / mx) * (W - L - R);
      s += `<text x="0" y="${y + 26}" class="lbl-strong">${esc(it[0])}</text>`;
      [[it[1], "var(--s1)", 0], [it[2], "var(--s2)", 1]].forEach(([v, col, k]) => { const yy = y + 8 + k * 26; s += `<rect x="${L}" y="${yy}" width="${Math.max(2, X(v) - L)}" height="18" rx="4" style="fill:${col}"/><text x="${X(v) + 8}" y="${yy + 14}" class="lbl-strong">${v.toFixed(it[3])}</text><text x="${L - 10}" y="${yy + 14}" text-anchor="end">${esc(c.names[k])}</text>`; }); });
    el.innerHTML = frameHTML(c, s + "</svg>", `<div class="legend"><span><i style="background:var(--s1)"></i>${esc(c.names[0])}</span><span><i style="background:var(--s2)"></i>${esc(c.names[1])}</span></div>`);
  }
  function convChart(el, c) {
    const W = 640, rowH = 46, H = c.items.length * rowH + 40, L = 110, R = 40, X = (v) => L + (v / (c.ref * 1.05)) * (W - L - R);
    let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(c.title)}"><line x1="${X(c.ref)}" x2="${X(c.ref)}" y1="6" y2="${H - 26}" style="stroke:var(--crit)" stroke-dasharray="5 4" stroke-width="1.5"/><text x="${X(c.ref)}" y="${H - 8}" text-anchor="middle" style="fill:var(--crit)">UTS ${c.ref} ${esc(c.unit)}</text>`;
    c.items.forEach((it, i) => { const y = 10 + i * rowH; s += `<text x="${L - 10}" y="${y + 18}" text-anchor="end" class="lbl-strong">${esc(it[0])}</text><rect x="${L}" y="${y + 4}" width="${X(it[1]) - L}" height="20" rx="4" style="fill:var(--acc)" opacity="${it[1] > 23 ? 1 : 0.55}"/><text x="${X(it[1]) + 8}" y="${y + 19}" class="lbl-strong">${it[1]} ${esc(c.unit)} · FoS ${(c.ref / it[1]).toFixed(2)}</text>`; });
    el.innerHTML = frameHTML(c, s + "</svg>");
  }

})();
