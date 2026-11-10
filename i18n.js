(function () {
  "use strict";

  var KEY = "lang";

  function read() {
    try {
      return localStorage.getItem(KEY) === "en" ? "en" : "zh";
    } catch (err) {
      return "zh";
    }
  }

  function write(lang) {
    try {
      localStorage.setItem(KEY, lang);
    } catch (err) {
      /* private mode */
    }
  }

  function apply(lang) {
    document.documentElement.lang = lang === "en" ? "en" : "zh-CN";

    document.querySelectorAll("[data-en]").forEach(function (el) {
      if (!el.hasAttribute("data-zh")) el.setAttribute("data-zh", (el.textContent || "").trim());
      el.textContent = lang === "en" ? el.getAttribute("data-en") : el.getAttribute("data-zh");
    });

    document.querySelectorAll("[data-en-html]").forEach(function (el) {
      if (!el.hasAttribute("data-zh-html")) el.setAttribute("data-zh-html", el.innerHTML.trim());
      el.innerHTML = lang === "en" ? el.getAttribute("data-en-html") : el.getAttribute("data-zh-html");
    });

    document.querySelectorAll("meta[data-en-content]").forEach(function (el) {
      if (!el.hasAttribute("data-zh-content")) el.setAttribute("data-zh-content", el.getAttribute("content") || "");
      el.setAttribute("content", lang === "en" ? el.getAttribute("data-en-content") : el.getAttribute("data-zh-content"));
    });

    document.querySelectorAll("[data-en-aria]").forEach(function (el) {
      if (!el.hasAttribute("data-zh-aria")) el.setAttribute("data-zh-aria", el.getAttribute("aria-label") || "");
      el.setAttribute("aria-label", lang === "en" ? el.getAttribute("data-en-aria") : el.getAttribute("data-zh-aria"));
    });

    document.querySelectorAll("[data-en-alt]").forEach(function (el) {
      if (!el.hasAttribute("data-zh-alt")) el.setAttribute("data-zh-alt", el.getAttribute("alt") || "");
      el.alt = lang === "en" ? el.getAttribute("data-en-alt") : el.getAttribute("data-zh-alt");
    });

    var btn = document.getElementById("lang-toggle");
    if (btn) {
      btn.textContent = lang === "zh" ? "EN" : "中文";
      btn.setAttribute("aria-label", lang === "zh" ? "Switch to English" : "切换到中文");
      btn.setAttribute("aria-pressed", lang === "en" ? "true" : "false");
    }

    document.dispatchEvent(new CustomEvent("site-lang", { detail: { lang: lang } }));
  }

  var lang = read();

  function setLang(next) {
    lang = next === "en" ? "en" : "zh";
    write(lang);
    apply(lang);
  }

  window.siteLang = {
    get: function () { return lang; },
    set: setLang,
    toggle: function () { setLang(lang === "en" ? "zh" : "en"); }
  };

  function boot() {
    apply(lang);
    var btn = document.getElementById("lang-toggle");
    if (btn) btn.addEventListener("click", function () { window.siteLang.toggle(); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
