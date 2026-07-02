/* ===== Alp'Sciences — shared header/footer loader ===== */
(function () {
  "use strict";

  function altLangHref(pathname) {
    const isEn = /(^|\/)en\//.test(pathname);
    const file = pathname.split("/").pop() || "index.html";
    if (isEn) {
      if (file === "projects.html") return "../projets.html";
      if (file === "legal-notice.html") return "../mentions-legales.html";
      if (file.indexOf("post-") === 0) return "../billet-" + file.slice(5);
      if (file.indexOf("project-") === 0) return "../projet-" + file.slice(8);
      return "../" + file;
    }
    if (file === "projets.html") return "en/projects.html";
    if (file === "mentions-legales.html") return "en/legal-notice.html";
    if (file.indexOf("billet-") === 0) return "en/post-" + file.slice(7);
    if (file.indexOf("projet-") === 0) return "en/project-" + file.slice(7);
    return "en/" + file;
  }

  function setLangLinks(root, isEn, selfFile) {
    const otherHref = altLangHref(location.pathname);
    root.querySelectorAll(".lang-fr").forEach((a) => {
      a.href = isEn ? otherHref : selfFile;
      a.classList.toggle("on", !isEn);
    });
    root.querySelectorAll(".lang-en").forEach((a) => {
      a.href = isEn ? selfFile : otherHref;
      a.classList.toggle("on", isEn);
    });
  }

  function markActive(root, selfFile) {
    root.querySelectorAll(".nav-links > a[href]").forEach((a) => {
      if (a.getAttribute("href") === selfFile) a.classList.add("active");
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

  const isEn = /(^|\/)en\//.test(location.pathname);
  const selfFile = location.pathname.split("/").pop() || "index.html";
  const base = isEn ? "../" : "";
  const lang = isEn ? "en" : "fr";

  const headerPh = document.querySelector('[data-include="header"]');
  const footerPh = document.querySelector('[data-include="footer"]');

  Promise.all([
    headerPh ? fetch(base + "partials/header-" + lang + ".html").then((r) => r.text()) : Promise.resolve(null),
    footerPh ? fetch(base + "partials/footer-" + lang + ".html").then((r) => r.text()) : Promise.resolve(null),
  ]).then(([headerHtml, footerHtml]) => {
    const headerNode = headerHtml ? inject(headerPh, headerHtml) : null;
    const footerNode = footerHtml ? inject(footerPh, footerHtml) : null;
    if (headerNode) {
      markActive(headerNode, selfFile);
      setLangLinks(headerNode, isEn, selfFile);
    }
    if (footerNode) {
      setLangLinks(footerNode, isEn, selfFile);
      fillYear();
    }
    wireBurger();
    document.dispatchEvent(new CustomEvent("partials:loaded"));
  });
})();
