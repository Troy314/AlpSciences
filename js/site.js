/* ===== Alp'Sciences - redesign interactions (theme, grain, altitude, lists) ===== */
(function () {
  "use strict";
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const BASE = document.documentElement.dataset.base || "";
  const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  /* FR->EN runtime translation (js/i18n-en.js defines ALP_DICT on English pages only) */
  const D = window.ALP_DICT || null;
  const LONG = D ? Object.keys(D).filter((k) => k.length >= 14).sort((a, b) => b.length - a.length) : [];
  const MONTHS = [["janvier", "January"], ["février", "February"], ["mars", "March"], ["avril", "April"], ["mai", "May"], ["juin", "June"], ["juillet", "July"], ["août", "August"], ["septembre", "September"], ["octobre", "October"], ["novembre", "November"], ["décembre", "December"], ["déc.", "Dec."], ["fév.", "Feb."], ["sept.", "Sept."], ["janv.", "Jan."], ["juil.", "Jul."]];
  const MRX = MONTHS.map(([f, e]) => [new RegExp("(^|[^\\p{L}])" + f.replace(".", "\\.") + "(?![\\p{L}])", "giu"), e]);
  function T(s) {
    if (!D || !s) return s;
    const k = s.replace(/\s+/g, " ").trim();
    if (D[k] !== undefined) return D[k];
    let v = k;
    for (const key of LONG) if (v.includes(key)) v = v.split(key).join(D[key]);
    if (v !== k) return v;
    MRX.forEach(([re, e]) => { v = v.replace(re, (m, p1) => p1 + e); });
    return v.replace(/\bMaintenant\b/g, "Present");
  }
  window.ALP_T = T;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
  };

  /* ---- theme ---- */
  function syncThemeBtn() {
    const dark = document.documentElement.classList.contains("dark");
    const label = T(dark ? "Passer en mode clair" : "Passer en mode sombre");
    $$("[data-theme-toggle]").forEach((b) => {
      b.setAttribute("aria-pressed", dark ? "true" : "false");
      b.setAttribute("aria-label", label);
      b.title = label;
    });
  }
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-theme-toggle]");
    if (!b) return;
    const dark = document.documentElement.classList.toggle("dark");
    store.set("alp-theme", dark ? "dark" : "light");
    syncThemeBtn();
  });
  document.addEventListener("partials:loaded", syncThemeBtn);

  /* ---- grain (fixed paper-noise layer) ---- */
  (function grain() {
    const c = document.createElement("canvas");
    c.width = c.height = 200;
    const x = c.getContext("2d"), d = x.createImageData(200, 200), q = d.data;
    for (let i = 0; i < q.length; i += 4) {
      const v = Math.random() < 0.5 ? 0 : 255;
      q[i] = q[i + 1] = q[i + 2] = v;
      q[i + 3] = Math.random() * 60;
    }
    x.putImageData(d, 0, 0);
    const el = document.createElement("div");
    el.setAttribute("aria-hidden", "true");
    let amount = Number(store.get("alp-grain"));
    if (store.get("alp-grain") === null || isNaN(amount)) amount = 50;
    el.style.cssText = "position:fixed;inset:0;z-index:90;pointer-events:none;background-size:200px 200px;background-image:url(" + c.toDataURL() + ");opacity:" + (Math.max(0, Math.min(100, amount)) / 100) * 0.5;
    document.body.appendChild(el);
  })();

  /* ---- altitude ruler + badge (home) ---- */
  (function altitude() {
    const ruler = $("[data-alt]");
    if (!ruler) return;
    const mark = document.createElement("span");
    mark.className = "alt-mark"; mark.setAttribute("aria-hidden", "true");
    mark.innerHTML = "<i></i>";
    ruler.appendChild(mark);
    const b = document.createElement("div");
    b.className = "alt-badge"; b.setAttribute("aria-hidden", "true");
    b.innerHTML = "<i></i><span></span>";
    document.body.appendChild(b);
    const v = $("span", b);
    const upd = () => {
      const h = document.documentElement.scrollHeight - innerHeight;
      const p = h > 0 ? Math.min(1, Math.max(0, scrollY / h)) : 0;
      const alt = Math.round(4806 - p * (4806 - 214));
      v.textContent = alt.toLocaleString("fr-FR").replace(/ | /g, " ") + " m";
      mark.style.top = (p * 100).toFixed(2) + "%";
    };
    addEventListener("scroll", upd, { passive: true });
    addEventListener("resize", upd);
    upd();
  })();

  /* ---- blog list: search + category filter ---- */
  (function blog() {
    const rows = $$(".row[data-cat]");
    if (!rows.length) return;
    const input = $("#q"), chips = $$(".blog-chips .chip"), count = $("#count"), none = $("#none");
    let cat = "";
    function render() {
      const q = norm(input.value.trim());
      const hit = rows.filter((r) => !q || (r.dataset.search || "").includes(q));
      const shown = hit.filter((r) => !cat || r.dataset.cat === cat);
      rows.forEach((r) => (r.hidden = !shown.includes(r)));
      chips.forEach((c) => {
        const k = c.dataset.cat || "";
        const n = hit.filter((r) => !k || r.dataset.cat === k).length;
        c.querySelector(".n").textContent = n;
        c.setAttribute("aria-pressed", k === cat ? "true" : "false");
      });
      count.textContent = shown.length + (shown.length > 1 ? " articles" : " article");  // same word in EN
      none.hidden = shown.length > 0;
    }
    input.addEventListener("input", render);
    chips.forEach((c) => c.addEventListener("click", () => { cat = c.dataset.cat || ""; render(); }));
    const q = new URLSearchParams(location.search).get("cat");
    if (q && chips.some((c) => c.dataset.cat === q)) cat = q;
    render();
  })();

  /* ---- article: reading progress + table of contents ---- */
  (function article() {
    const art = $(".prose");
    const bar = $(".progress");
    if (!art || !bar) return;
    const ids = $$(".toc a").map((a) => a.getAttribute("href").slice(1));
    const links = $$(".toc a");
    const on = () => {
      let a = -1;
      ids.forEach((id, k) => { const e = document.getElementById(id); if (e && e.getBoundingClientRect().top < 160) a = k; });
      links.forEach((l, k) => l.setAttribute("aria-current", k === a ? "true" : "false"));
      const r = art.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - innerHeight * 0.6)));
      bar.style.width = (p * 100).toFixed(2) + "%";
    };
    addEventListener("scroll", on, { passive: true });
    addEventListener("resize", on);
    on();
  })();

  /* ---- médiation: tag filter + gallery/timeline view ---- */
  (function projects() {
    const chips = $$(".proj-chips .chip");
    if (!chips.length) return;
    const items = $$("[data-tags]");
    const tabs = $$(".view-tabs button");
    const grid = $(".proj-grid"), line = $(".proj-line");
    let tag = "";
    function filter() {
      items.forEach((it) => { it.hidden = !!tag && (it.dataset.tags || "").split("|").indexOf(tag) === -1; });
      $$(".tl-year").forEach((y) => { y.hidden = !$$("[data-tags]:not([hidden])", y).length; });
      chips.forEach((c) => c.setAttribute("aria-pressed", (c.dataset.tag || "") === tag ? "true" : "false"));
    }
    function view(v) {
      v = v === "grid" ? "grid" : "line";
      grid.hidden = v !== "grid"; line.hidden = v !== "line";
      tabs.forEach((t) => t.setAttribute("aria-selected", t.dataset.view === v ? "true" : "false"));
      store.set("alp-proj-view", v);
    }
    chips.forEach((c) => c.addEventListener("click", () => { tag = c.dataset.tag || ""; filter(); }));
    tabs.forEach((t) => t.addEventListener("click", () => view(t.dataset.view)));
    const qtag = new URLSearchParams(location.search).get("tag");
    if (qtag && chips.some((c) => c.dataset.tag === qtag)) tag = qtag;
    filter();
    view(store.get("alp-proj-view") || "line");
  })();

  /* ---- parcours: timeline from js/parcours-data.js ---- */
  (function parcours() {
    const host = $("#pc-years");
    if (!host || !window.PARCOURS) return;
    const cats = ["Formation", "Communication", "Recherche", "Associations"];
    const cols = ["#8c57f6", "#4a2e6f", "#f1cb48", "#efcc83"];
    const order = [1, 0, 2, 3];
    const MO = ["janv", "fév", "mars", "avr", "mai", "juin", "juil", "août", "sept", "oct", "nov", "déc"];
    // grouped and sorted by start date (first year / first month in the text)
    const yearOf = (w) => { const m = w.match(/20\d\d/); return m ? Number(m[0]) : 0; };
    const monthOf = (w) => { const pre = w.split(/20\d\d/)[0].toLowerCase(); let best = 0, pos = Infinity; MO.forEach((x, i) => { const k = pre.indexOf(x); if (k >= 0 && k < pos) { pos = k; best = i + 1; } }); return best; };
    const esc = (s) => T(String(s)).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
    const on = [true, true, true, true];
    const flat = [];
    window.PARCOURS.forEach((b, bi) => b.items.forEach((it) => {
      const when = it.when;
      flat.push(Object.assign({}, it, { cat: cats[bi], col: cols[bi], bi, y: yearOf(when), key: yearOf(when) * 13 + monthOf(when) }));
    }));
    const chipBox = $("#pc-chips");
    chipBox.innerHTML = order.map((i) => '<button type="button" class="chip" data-i="' + i + '" aria-pressed="true"><span class="sw" style="background:' + cols[i] + '"></span>' + esc(cats[i]) + "</button>").join("");
    function render() {
      const vis = flat.filter((x) => on[x.bi]).sort((p, q) => q.key - p.key);
      const ys = Array.from(new Set(vis.map((x) => x.y)));
      host.innerHTML = ys.map((y) =>
        '<div class="pc-year"><div class="y">' + y + '</div><div class="rail"><i></i></div><div class="pc-items">' +
        vis.filter((x) => x.y === y).map((it) =>
          '<article class="pc-card" style="--c:' + it.col + '"><div><div class="k">' + esc(it.cat) + " · " + esc(it.when) + "</div><h3>" + esc(it.title) + '</h3><div class="org">' + esc(it.org) + "</div>" +
          (it.tags && it.tags.length ? '<div class="tags">' + it.tags.map((t) => '<span class="tag">' + esc(t) + "</span>").join("") + "</div>" : "") +
          '<details><summary>' + esc("Plus de détails") + '</summary><p>' + esc(it.more) + "</p></details></div>" +
          '<img src="' + BASE + esc(it.logo) + '" alt="" loading="lazy"></article>').join("") +
        "</div></div>").join("");
      $$("button", chipBox).forEach((b) => b.setAttribute("aria-pressed", on[b.dataset.i] ? "true" : "false"));
    }
    chipBox.addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      const n = on.slice(); n[b.dataset.i] = !n[b.dataset.i];
      if (n.some(Boolean)) { n.forEach((v, i) => (on[i] = v)); render(); }
    });
    render();
  })();
})();
