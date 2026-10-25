/* ===== Alp'Sciences — home page widgets: cloud chamber, interests pie, muon counter, Sérotine feed ===== */
(function () {
  "use strict";
  const $ = (s, r) => (r || document).querySelector(s);
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const T = window.ALP_T || ((s) => s);
  const EN = document.documentElement.lang === "en";

  /* ---- cloud chamber (canvas particle tracks) ---- */
  (function cloud() {
    const c = $("#cloud");
    if (!c) return;
    const x = c.getContext("2d");
    let tr = [], last = 0, spawn = 0, W = 0, H = 0, raf = 0;
    const size = () => { const r = c.getBoundingClientRect(), k = devicePixelRatio || 1; c.width = r.width * k; c.height = r.height * k; x.setTransform(k, 0, 0, k, 0, 0); W = r.width; H = r.height; };
    size(); addEventListener("resize", size);
    const make = () => {
      const kind = Math.random(), edge = Math.random();
      let px = Math.random() * W, py = edge < 0.5 ? -10 : Math.random() * H * 0.6, a = Math.PI / 2 + (Math.random() - 0.5) * 1.6;
      if (edge > 0.85) { px = Math.random() < 0.5 ? -10 : W + 10; py = Math.random() * H * 0.5; a = px < 0 ? 0.3 + Math.random() * 0.6 : Math.PI - 0.3 - Math.random() * 0.6; }
      tr.push({ pts: [[px, py]], a, v: kind < 0.55 ? 9 : 6, curl: kind < 0.55 ? (Math.random() - 0.5) * 0.004 : (Math.random() < 0.5 ? -1 : 1) * (0.02 + Math.random() * 0.03),
        shrink: kind < 0.55 ? 1 : 0.985, age: 0, life: 90 + Math.random() * 80, w: kind < 0.55 ? 1.3 : 1.6 });
    };
    const step = (dt) => {
      spawn -= dt; if (spawn <= 0) { make(); spawn = 350 + Math.random() * 900; }
      tr.forEach((t) => { t.age++; if (t.age < t.life * 0.6) { t.a += t.curl; t.v *= t.shrink; const p = t.pts[t.pts.length - 1]; t.pts.push([p[0] + Math.cos(t.a) * t.v * 0.35, p[1] + Math.sin(t.a) * t.v * 0.35]); } });
      tr = tr.filter((t) => t.age < t.life);
    };
    const draw = () => {
      x.clearRect(0, 0, W, H);
      const rgb = getComputedStyle(document.documentElement).getPropertyValue("--trace").trim() || "74, 46, 111";
      tr.forEach((t) => {
        const f = Math.max(0, 1 - t.age / t.life);
        x.strokeStyle = "rgba(" + rgb + "," + (0.34 * f).toFixed(3) + ")"; x.lineWidth = t.w; x.lineCap = "round";
        x.beginPath(); t.pts.forEach((p, i) => (i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1]))); x.stroke();
      });
    };
    if (reduced) { for (let i = 0; i < 6; i++) { make(); for (let k = 0; k < 70; k++) step(0); tr.forEach((t) => (t.age = 0)); } draw(); return; }
    for (let i = 0; i < 4; i++) make();
    const loop = (ts) => { const dt = last ? Math.min(ts - last, 50) : 16; last = ts; step(dt); draw(); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
  })();

  /* ---- muon counter ---- */
  (function muon() {
    const out = $("#muons");
    if (!out) return;
    const dt = reduced ? 1 : 0.25;
    let n = 0;
    setInterval(() => {
      const e = Math.exp(-1.67 * dt); let p = 1, k = 0;
      do { k++; p *= Math.random(); } while (p > e);
      if (k > 1) { n += k - 1; out.textContent = n; }
    }, dt * 1000);
  })();

  /* ---- Sérotine feed (RSS/Atom, with graceful fallback) ---- */
  (function feed() {
    const box = $("#serotine-feed");
    if (!box) return;
    const url = box.dataset.url;
    const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 8000);
    const empty = () => { box.innerHTML = '<div class="empty" role="status">' + T("Sérotine · flux bientôt disponible") + "</div>"; };
    fetch(url, { signal: ctl.signal }).then((r) => { if (!r.ok) throw 0; return r.text(); }).then((xml) => {
      const d = new DOMParser().parseFromString(xml, "text/xml");
      if (d.querySelector("parsererror")) throw 0;
      const txt = (e, s) => { const n = e.querySelector(s); return n ? n.textContent.trim() : ""; };
      const esc = (s) => s.replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));
      const items = Array.from(d.querySelectorAll("item, entry")).slice(0, 3).map((e) => {
        const l = e.querySelector("link"), dt = new Date(txt(e, "pubDate") || txt(e, "published") || txt(e, "updated"));
        const link = (l && (l.getAttribute("href") || l.textContent.trim())) || "#";
        return { title: txt(e, "title"), link, date: isNaN(dt) ? "" : dt.toLocaleDateString(EN ? "en-GB" : "fr-FR", { month: "long", year: "numeric" }) };
      });
      if (!items.length) throw 0;
      box.innerHTML = items.map((it) => '<a href="' + esc(it.link) + '" target="_blank" rel="noopener"><span class="d">' + esc(it.date) + '</span><span class="t">' + esc(it.title) + "</span></a>").join("");
    }).catch(empty).finally(() => clearTimeout(t));
  })();

  /* ---- interests pie ---- */
  (function pie() {
    const host = $("#pie");
    if (!host) return;
    const BASE = document.documentElement.dataset.base || "";
    const P = EN ? "projects/" : "projets/"; // links stay inside the language tree (BASE is only for assets)
    const D = [
      { name: "Médiation scientifique", src: "assets/img_20240823_085659.webp", alt: "Animation scientifique", fill: "#4a2e6f", ink: "#f8f5ef", text: "Transmettre, c'est avant tout échanger. Animations, démonstrations et dispositifs, avec AurorAlpes, au CERN Science Gateway et à Cosmocité.", projets: [["Toile de relativité", P + "toile-de-relativite/"], ["Malette du petit sceptique", P + "malette-du-petit-sceptique/"], ["Développement de médiation au CERN", P + "cern-science-gateway/"]] },
      { name: "Écriture scientifique", src: "assets/serotine.webp", alt: "Webzine Sérotine", fill: "#8c57f6", ink: "#f8f5ef", text: "Écrire sur les sciences : ce blog, un webzine de vulgarisation dont je suis responsable de la publication, et un mémoire de recherche.", projets: [["Webzine de Vulgarisation : Sérotine", P + "webzine-serotine/"], ["Mémoire : recherche participative", P + "memoire_csti/"], ["Billets du blog", "blog/"]] },
      { name: "Événementiel", src: "assets/img_20231120_122640.webp", alt: "Village des sciences", fill: "#f1cb48", ink: "#231535", text: "Tenir un village des sciences, organiser une journée de réflexion : faire se rencontrer les publics et les acteurs de la médiation.", projets: [["Village de la Météorologie de l'espace (ESWW24)", P + "esww24-meteo-espace/"], ["Agora des Sciences", P + "agora-des-sciences/"]] },
      { name: "Gestion de projet", src: "assets/Agora_sciences.webp", alt: "Agora des Sciences", fill: "#efcc83", ink: "#231535", text: "Des BDE à AurorAlpes, où je suis co-gestionnaire de projet : gestion de projet et gestion d'équipe.", projets: [["Agora des Sciences", P + "agora-des-sciences/"], ["Webzine de Vulgarisation : Sérotine", P + "webzine-serotine/"], ["Portail de ressources web IPPOG", P + "ippog-resources-portal/"]] },
      { name: "Physique des particules", src: "assets/cloudchamber.webp", alt: "Traces de particules dans une chambre à brouillard", fill: "#231535", ink: "#f8f5ef", text: "L'étude des constituants élémentaires de la matière et de leurs interactions. C'est la science qui me fascine le plus.", projets: [["Développement de médiation au CERN", P + "cern-science-gateway/"], ["Portail de ressources web IPPOG", P + "ippog-resources-portal/"], ["Étude de jets dans l'expérience ALICE", "cv/"]] },
      { name: "Sciences participatives", src: "assets/memoire.webp", alt: "Mémoire de recherche : recherche participative", fill: "#cbb8f5", ink: "#231535", text: "Depuis plusieurs années, « science participative » et « recherche participative » font partie du vocabulaire commun. Mon mémoire délie ces notions et étudie les dispositifs mis en place pour les développer.", projets: [["Mémoire : recherche participative", P + "memoire_csti/"], ["Billets du blog", "blog/"]] },
    ];
    const ICONS = [
      '<circle cx="0" cy="-4" r="10"/><path d="M-4 9 H4 M-3 13 H3 M-2 6 V9 M2 6 V9"/><path d="M0 -19 V-17 M-14 -14 L-13 -13 M14 -14 L13 -13 M-18 -4 H-16 M16 -4 H18"/>',
      '<rect x="-12" y="-14" width="26" height="28" rx="2"/><path d="M-12 -9 H-16 V11 Q-16 14 -13 14"/><rect x="-8" y="-10" width="9" height="9" fill="INK"/><path d="M4 -9 H10 M4 -4 H10 M-8 4 H10 M-8 9 H10"/>',
      '<rect x="-15" y="-11" width="30" height="27" rx="3"/><path d="M-8 -16 V-8 M-3 -16 V-8 M3 -16 V-8 M8 -16 V-8 M-15 -3 H15"/><circle cx="-8" cy="4" r="1.6" fill="INK"/><circle cx="0" cy="4" r="1.6" fill="INK"/><circle cx="8" cy="4" r="1.6" fill="INK"/><circle cx="-8" cy="10" r="1.6" fill="INK"/><circle cx="0" cy="10" r="1.6" fill="INK"/>',
      '<rect x="-14" y="-13" width="18" height="7" fill="INK"/><rect x="-6" y="-2" width="21" height="7" fill="INK"/><rect x="-14" y="9" width="13" height="7" fill="INK"/>',
      '<circle cx="0" cy="0" r="3.5" fill="INK"/><ellipse cx="0" cy="0" rx="16" ry="6.5"/><ellipse cx="0" cy="0" rx="16" ry="6.5" transform="rotate(60)"/><ellipse cx="0" cy="0" rx="16" ry="6.5" transform="rotate(-60)"/>',
      '<circle cx="0" cy="0" r="17"/><text x="0" y="5" text-anchor="middle" font-family="Familjen Grotesk, sans-serif" font-size="15" font-weight="700" fill="INK" stroke="none">sci</text>',
    ];
    D.forEach((d) => { d.name = T(d.name); d.alt = T(d.alt); d.text = T(d.text); d.projets = d.projets.map((q) => [T(q[0]), q[1]]); });
    const BASEOUT = [250, 274, 224, 260, 236, 256];
    const n = D.length, cx = 300, cy = 300, Ri = 118, L = "abcdef";
    let sel = 0;
    const esc = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
    const exHtml = (d, pad) => '<ul class="ex-list">' + d.projets.map((p) => '<li><a href="' + p[1] + '"><span>' + esc(p[0]) + "</span><span>→</span></a></li>").join("") + "</ul>";
    const rad = (a, r) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
    const edge = (a, side, r) => { const h = 6, t = Math.sqrt(r * r - h * h), ux = Math.cos(a), uy = Math.sin(a), nx = side * -uy, ny = side * ux; return [cx + nx * h + ux * t, cy + ny * h + uy * t]; };

    host.innerHTML =
      '<div class="pie-head"><h2 class="h2">' + T("Mes terrains de jeu") + '</h2><span>' + T("cliquez sur une part") + '</span></div>' +
      '<div class="pie-grid"><div class="pie-box"><div class="pie-svg-wrap" id="pie-wrap"><svg viewBox="0 0 600 600" role="group" aria-label="' + T("Diagramme circulaire : six centres d\'intérêt") + '"></svg><div id="pie-icons"></div>' +
      '<div class="pie-center"><b id="pie-no">01</b><span>' + T("sur 06") + '</span></div></div><ul class="pie-list" id="pie-list"></ul></div>' +
      '<div class="pie-panel" id="pie-panel" aria-live="polite"></div></div>';
    document.body.insertAdjacentHTML("beforeend", '<div class="pie-sheet" id="pie-sheet"><div role="dialog" aria-modal="true" aria-label="' + T("Détail") + '"><button type="button" class="x" aria-label="' + T("Fermer") + '">×</button><div id="pie-sheet-body"></div></div></div>');
    const svg = $("#pie-wrap svg"), icons = $("#pie-icons"), list = $("#pie-list"), panel = $("#pie-panel"), sheet = $("#pie-sheet");

    function paint() {
      svg.innerHTML = D.map((d, i) => {
        const a0 = -Math.PI / 2 + (i * 2 * Math.PI) / n, a1 = -Math.PI / 2 + ((i + 1) * 2 * Math.PI) / n, on = i === sel;
        const Ro = on ? BASEOUT[i] + 12 : BASEOUT[i];
        const [x0, y0] = edge(a0, 1, Ro), [x1, y1] = edge(a1, -1, Ro), [x2, y2] = edge(a1, -1, Ri), [x3, y3] = edge(a0, 1, Ri);
        const dd = "M" + x0.toFixed(1) + " " + y0.toFixed(1) + " A" + Ro + " " + Ro + " 0 0 1 " + x1.toFixed(1) + " " + y1.toFixed(1) + " L" + x2.toFixed(1) + " " + y2.toFixed(1) + " A" + Ri + " " + Ri + " 0 0 0 " + x3.toFixed(1) + " " + y3.toFixed(1) + " Z";
        return '<path d="' + dd + '" fill="' + d.fill + '" data-i="' + i + '" tabindex="0" role="button" aria-label="' + esc(d.name) + '" aria-pressed="' + on + '"/>';
      }).join("") + '<circle cx="300" cy="300" r="136" fill="var(--block)"/><circle cx="300" cy="300" r="126" fill="var(--bg)"/>';
      const small = $("#pie-wrap").getBoundingClientRect().width < 520;
      icons.innerHTML = D.map((d, i) => {
        const am = -Math.PI / 2 + ((i + 0.5) * 2 * Math.PI) / n, on = i === sel;
        const [lx, ly] = rad(am, (Ri + (on ? BASEOUT[i] + 12 : BASEOUT[i])) / 2 + 6);
        return '<div class="pie-ico" style="left:' + (lx / 6).toFixed(2) + "%;top:" + (ly / 6).toFixed(2) + "%;color:" + d.ink + ";width:" + (small ? "24%" : "30%") + '"><svg viewBox="-20 -20 40 40" style="width:' + (small ? 28 : 38) + "px;height:" + (small ? 28 : 38) + 'px" fill="none" stroke="' + d.ink + '" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONS[i].replace(/INK/g, d.ink) + "</svg></div>";
      }).join("");
      $("#pie-no").textContent = "0" + (sel + 1);
      list.innerHTML = D.map((d, i) => '<li><button type="button" data-i="' + i + '" aria-pressed="' + (i === sel) + '"><span class="dot" style="background:' + d.fill + '"></span><span>' + esc(d.name) + '</span><span class="no">0' + (i + 1) + "</span></button></li>").join("");
      const d = D[sel], fig = "Figure 2" + L[sel];
      panel.innerHTML = '<figure><img src="' + BASE + d.src + '" alt="' + esc(d.alt) + '" loading="lazy"><figcaption>' + fig + " — " + esc(d.alt) + '</figcaption></figure><div class="pie-cols"><div><h3>' + esc(d.name) + "</h3><p>" + esc(d.text) + '</p></div><div><div class="ex-title">' + T("Exemples de projets") + "</div>" + exHtml(d) + "</div></div>";
      const w = $("#pie-wrap").getBoundingClientRect().width;
      panel.style.setProperty("--pie-h", Math.round(w) + "px");
    }
    function openSheet() {
      const d = D[sel], fig = "Figure 2" + L[sel];
      $("#pie-sheet-body").innerHTML = '<div class="k">' + fig + " · 0" + (sel + 1) + " " + T("sur 06") + "</div><h3>" + esc(d.name) + '</h3><img src="' + BASE + d.src + '" alt="' + esc(d.alt) + '"><div class="fig">' + fig + " — " + esc(d.alt) + "</div><p>" + esc(d.text) + '</p><div class="ex-title" style="margin-top:16px">' + T("Exemples de projets") + '</div>' + exHtml(d);
      sheet.classList.add("open"); sheet.querySelector(".x").focus();
    }
    const closeSheet = () => sheet.classList.remove("open");
    const pick = (i, kbd) => { sel = i; paint(); if (kbd) { const el = svg.querySelector('path[data-i="' + i + '"]'); if (el) el.focus(); } if (innerWidth < 720) openSheet(); };
    svg.addEventListener("click", (e) => { const p = e.target.closest("path[data-i]"); if (p) pick(+p.dataset.i); });
    svg.addEventListener("keydown", (e) => { const p = e.target.closest("path[data-i]"); if (p && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); pick(+p.dataset.i, true); } });
    list.addEventListener("click", (e) => { const b = e.target.closest("button[data-i]"); if (b) pick(+b.dataset.i); });
    sheet.addEventListener("click", (e) => { if (e.target === sheet || e.target.closest(".x")) closeSheet(); });
    addEventListener("keydown", (e) => { if (e.key === "Escape") closeSheet(); });
    let lastW = innerWidth; addEventListener("resize", () => { if (innerWidth !== lastW) { lastW = innerWidth; paint(); } });
    paint();
  })();
})();
