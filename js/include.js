/* ===== Alp'Sciences — shared header/footer loader ===== */
(function () {
  "use strict";

  // Only the section name differs between languages; blog/cv/contact are the same word.
  const MAP_TO_EN = { projets: "projects", "mentions-legales": "legal-notice" };
  const MAP_TO_FR = { projects: "projets", "legal-notice": "mentions-legales" };

  /** Parse the current path into { isEn, rest, depth }.
   *  rest = path segments after the optional leading "en/" (e.g. [] for home,
   *  ["cv"] for a top-level page, ["blog","hydrocerames"] for a detail page).
   *  depth = number of "../" needed to reach the site root from this page. */
  function pathInfo(pathname) {
    const segs = pathname.split("/").filter(Boolean);
    const isEn = segs[0] === "en";
    const rest = isEn ? segs.slice(1) : segs;
    const depth = (isEn ? 1 : 0) + rest.length;
    return { isEn, rest, depth };
  }

  /** Same-content page in the other language, relative to the current page. */
  function altLangHref(info) {
    const targetRest = info.rest.slice();
    if (targetRest.length) {
      const map = info.isEn ? MAP_TO_FR : MAP_TO_EN;
      targetRest[0] = map[targetRest[0]] || targetRest[0];
    }
    const prefixSegs = info.isEn ? targetRest : ["en"].concat(targetRest);
    return "../".repeat(info.depth) + prefixSegs.join("/") + (prefixSegs.length ? "/" : "");
  }

  function setLangLinks(root, info) {
    const otherHref = altLangHref(info);
    const selfHref = "./";
    root.querySelectorAll(".lang-fr").forEach((a) => {
      a.href = info.isEn ? otherHref : selfHref;
      a.classList.toggle("on", !info.isEn);
    });
    root.querySelectorAll(".lang-en").forEach((a) => {
      a.href = info.isEn ? selfHref : otherHref;
      a.classList.toggle("on", info.isEn);
    });
  }

  /** The header/footer partials assume they're injected at the language root
   *  (hrefs like "blog/", "cv/"); on any nested page they need this many
   *  "../" prepended to still reach those same folders. */
  function navPrefix(info) {
    return "../".repeat(info.rest.length);
  }

  function markActive(root, info) {
    const target = info.rest.length ? info.rest[0] + "/" : "./";
    root.querySelectorAll(".nav-links > a[href]").forEach((a) => {
      if (a.getAttribute("href") === target) a.classList.add("active");
    });
  }

  function fixNavPrefix(root, pre) {
    if (!pre) return;
    root.querySelectorAll("a[href]:not(.lang-fr):not(.lang-en)").forEach((a) => {
      const href = a.getAttribute("href");
      if (/^([a-z][a-z0-9+.-]*:|#)/i.test(href)) return; // absolute URLs, mailto:, tel:, #anchors
      a.setAttribute("href", pre + href);
    });
  }

  function wireBurger() {
    const burger = document.querySelector(".burger");
    const links = document.querySelector(".nav-links");
    if (!burger || !links) return;
    burger.addEventListener("click", () => {
      links.classList.toggle("open");
      burger.classList.toggle("x");
    });
    links.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => links.classList.remove("open"))
    );
  }

  function fillYear() {
    document.querySelectorAll(".js-year").forEach((el) => (el.textContent = new Date().getFullYear()));
  }

  function inject(placeholder, html) {
    if (!placeholder) return null;
    const tmp = document.createElement("div");
    tmp.innerHTML = html.trim();
    const node = tmp.firstElementChild;
    placeholder.replaceWith(node);
    return node;
  }

  const info = pathInfo(location.pathname);
  const base = "../".repeat(info.depth);
  const lang = info.isEn ? "en" : "fr";
  const navPre = navPrefix(info);

  const headerPh = document.querySelector('[data-include="header"]');
  const footerPh = document.querySelector('[data-include="footer"]');

  Promise.all([
    headerPh ? fetch(base + "partials/header-" + lang + ".html").then((r) => r.text()) : Promise.resolve(null),
    footerPh ? fetch(base + "partials/footer-" + lang + ".html").then((r) => r.text()) : Promise.resolve(null),
  ]).then(([headerHtml, footerHtml]) => {
    const headerNode = headerHtml ? inject(headerPh, headerHtml) : null;
    const footerNode = footerHtml ? inject(footerPh, footerHtml) : null;
    if (headerNode) {
      markActive(headerNode, info);
      fixNavPrefix(headerNode, navPre);
      setLangLinks(headerNode, info);
    }
    if (footerNode) {
      fixNavPrefix(footerNode, navPre);
      setLangLinks(footerNode, info);
      fillYear();
    }
    wireBurger();
    document.dispatchEvent(new CustomEvent("partials:loaded"));
  });
})();
