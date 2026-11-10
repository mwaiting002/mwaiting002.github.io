(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var tagline = document.getElementById("tagline");
  var phraseTimer = 0;

  function phrases() {
    var en = window.siteLang && siteLang.get() === "en";
    return en
      ? [
          "Embodied AI and computer vision",
          "6D pose, dual-arm and mobile work",
          "ROS 2 · Nav2 · MoveIt 2 · Isaac Sim",
          "Graduate student"
        ]
      : [
          "研究具身智能与计算机视觉",
          "6D 姿态 · 双臂与移动操作",
          "ROS 2 · Nav2 · MoveIt 2 · Isaac Sim",
          "研三，做具身智能和视觉"
        ];
  }

  function stopTagline() {
    window.clearTimeout(phraseTimer);
  }

  function startTagline() {
    stopTagline();
    if (!tagline) return;
    var list = phrases();
    if (reduce) {
      tagline.textContent = list[0];
      return;
    }
    var index = 0;
    var count = list[0].length;
    var deleting = false;
    var tick = function () {
      var phrase = phrases()[index] || "";
      if (!deleting) {
        count += 1;
        tagline.textContent = phrase.slice(0, count);
        if (count >= phrase.length) {
          deleting = true;
          phraseTimer = window.setTimeout(tick, 1600);
          return;
        }
        phraseTimer = window.setTimeout(tick, 78);
        return;
      }
      count -= 1;
      tagline.textContent = phrase.slice(0, Math.max(0, count));
      if (count <= 0) {
        deleting = false;
        index = (index + 1) % phrases().length;
        count = 0;
        phraseTimer = window.setTimeout(tick, 280);
        return;
      }
      phraseTimer = window.setTimeout(tick, 36);
    };
    tagline.textContent = list[0];
    phraseTimer = window.setTimeout(tick, 900);
  }

  startTagline();
  document.addEventListener("site-lang", startTagline);

  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");

  function menuLabel(open) {
    var en = window.siteLang && siteLang.get() === "en";
    if (open) return en ? "Close menu" : "关闭菜单";
    return en ? "Open menu" : "打开菜单";
  }

  function closeNav() {
    if (!nav || !toggle) return;
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    var label = toggle.querySelector(".sr-only");
    if (label) label.textContent = menuLabel(false);
  }

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      var label = toggle.querySelector(".sr-only");
      if (label) label.textContent = menuLabel(open);
      if (open) {
        var first = nav.querySelector("a");
        if (first) first.focus();
      }
    });
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeNav);
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && nav.classList.contains("is-open")) {
        closeNav();
        toggle.focus();
      }
    });
    document.addEventListener("site-lang", function () {
      var label = toggle.querySelector(".sr-only");
      if (label) label.textContent = menuLabel(nav.classList.contains("is-open"));
    });
  }

  var chips = Array.prototype.slice.call(document.querySelectorAll("[data-filter]"));
  var cards = Array.prototype.slice.call(document.querySelectorAll(".card"));
  var status = document.getElementById("filter-status");
  var empty = document.getElementById("empty-filter");
  var currentKey = "all";
  var currentChip = chips.filter(function (chip) { return chip.getAttribute("data-filter") === "all"; })[0] || null;

  function statusText(visible, key, chip) {
    var en = window.siteLang && siteLang.get() === "en";
    var base = en ? visible + (visible === 1 ? " video" : " videos") : visible + " 条视频";
    if (key === "all" || !chip) return base;
    return base + " · " + chip.textContent.replace(/\s+/g, " ").trim();
  }

  function applyFilter(key, chip) {
    currentKey = key;
    currentChip = chip;
    chips.forEach(function (item) {
      item.setAttribute("aria-pressed", item === chip ? "true" : "false");
    });
    var visible = 0;
    cards.forEach(function (card) {
      var tags = (card.getAttribute("data-tags") || "").split(/\s+/);
      var show = key === "all" || tags.indexOf(key) !== -1;
      card.hidden = !show;
      if (show) visible += 1;
    });
    if (status) status.textContent = statusText(visible, key, chip);
    if (empty) empty.hidden = visible !== 0;
    if (window.history && window.history.replaceState) {
      var url = new URL(window.location.href);
      if (key === "all") url.searchParams.delete("tag");
      else url.searchParams.set("tag", key);
      window.history.replaceState(null, "", url);
    }
  }

  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      applyFilter(chip.getAttribute("data-filter") || "all", chip);
      var work = document.getElementById("work");
      if (!work) return;
      if (work.getBoundingClientRect().top > window.innerHeight * 0.35) {
        work.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      }
    });
  });

  document.addEventListener("site-lang", function () {
    if (currentChip) applyFilter(currentKey, currentChip);
  });

  if (currentChip) applyFilter(currentKey, currentChip);

  var params = new URLSearchParams(window.location.search);
  var initial = params.get("tag");
  if (initial) {
    var match = chips.filter(function (chip) { return chip.getAttribute("data-filter") === initial; })[0];
    if (match) applyFilter(initial, match);
  }

  document.querySelectorAll('a[href^="#v-"]').forEach(function (link) {
    link.addEventListener("click", function () {
      var all = chips.filter(function (chip) { return chip.getAttribute("data-filter") === "all"; })[0];
      if (all) applyFilter("all", all);
    });
  });

  var copyButton = document.getElementById("copy-email");
  var email = "18131537762@163.com";
  if (copyButton) {
    copyButton.addEventListener("click", function () {
      var en = window.siteLang && siteLang.get() === "en";
      var done = function (ok) {
        copyButton.dataset.state = ok ? "done" : "error";
        copyButton.textContent = ok ? (en ? "Copied" : "已复制") : (en ? "Select the address" : "请手动选择邮箱");
        window.setTimeout(function () {
          copyButton.dataset.state = "";
          var nowEn = window.siteLang && siteLang.get() === "en";
          copyButton.textContent = nowEn ? "Copy email" : "复制邮箱";
        }, 1800);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(email).then(function () { done(true); }).catch(function () { done(false); });
      } else {
        done(false);
      }
    });
  }
})();
