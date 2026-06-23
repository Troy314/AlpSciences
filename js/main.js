/* ===== Alp'Sciences — shared interactions ===== */
(function () {
  "use strict";

  /* ---- mobile nav ---- */
  const burger = document.querySelector(".burger");
  const links = document.querySelector(".nav-links");
  if (burger && links) {
    burger.addEventListener("click", () => {
      links.classList.toggle("open");
      burger.classList.toggle("x");
    });
    links.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => links.classList.remove("open"))
    );
  }

  /* ---- scroll reveal ---- */
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    },
    { threshold: 0.12 }
  );
  document.querySelectorAll(".reveal-up").forEach((el, i) => {
    el.style.transitionDelay = (i % 4) * 0.07 + "s";
    io.observe(el);
  });

  /* ---- hero particle trails ---- */
  const field = document.querySelector(".particles");
  if (field && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    for (let i = 0; i < 14; i++) {
      const s = document.createElement("span");
      s.style.width = 60 + Math.random() * 160 + "px";
      s.style.top = Math.random() * 100 + "%";
      s.style.left = Math.random() * 60 + "%";
      s.style.animationDuration = 5 + Math.random() * 6 + "s";
      s.style.animationDelay = -Math.random() * 8 + "s";
      field.appendChild(s);
    }
  }

  /* ---- project tag filter (projects timeline) ---- */
  const bar = document.querySelector(".tagbar");
  const items = Array.from(document.querySelectorAll(".ptl-item"));
  if (bar && items.length) {
    const chips = Array.from(bar.querySelectorAll(".tag-chip"));
    function applyFilter(tag) {
      items.forEach((it) => {
        const tags = (it.dataset.tags || "").split("|");
        const show = !tag || tags.indexOf(tag) !== -1;
        it.style.display = show ? "" : "none";
      });
      chips.forEach((c) => c.classList.toggle("active", (c.dataset.tag || "") === tag));
      // re-trigger reveal for newly shown items
      items.forEach((it) => { if (it.style.display !== "none") it.classList.add("in"); });
    }
    // initial filter from ?tag= (links coming from project pages)
    const qtag = new URLSearchParams(location.search).get("tag");
    if (qtag && chips.some((c) => (c.dataset.tag || "") === qtag)) applyFilter(qtag);
    // delegate clicks from the bar and from inline mini-chips
    document.addEventListener("click", (ev) => {
      const chip = ev.target.closest("[data-tag]");
      if (!chip) return;
      ev.preventDefault();
      applyFilter(chip.dataset.tag || "");
      const head = document.querySelector(".ptl");
      if (head && chip.classList.contains("mini")) {
        window.scrollTo({ top: head.getBoundingClientRect().top + window.scrollY - 140, behavior: "smooth" });
      }
    });
  }

  /* ---- footer year ---- */
  document.querySelectorAll(".js-year").forEach((el) => (el.textContent = new Date().getFullYear()));
})();
