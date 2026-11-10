(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var tagline = document.getElementById("tagline");
  if (tagline && !reduce) {
    var phrases = [
      "研究具身智能与计算机视觉",
      "Embodied AI & computer vision",
      "研三找工作中，欢迎内推",
      "6D 姿态 · 双臂与移动操作",
      "ROS 2 · Nav2 · MoveIt 2 · Isaac Sim"
    ];
    var index = 0;
    var count = phrases[0].length;
    var deleting = false;

    var tick = function () {
      var phrase = phrases[index];
      if (!deleting) {
        count += 1;
        tagline.textContent = phrase.slice(0, count);
        if (count === phrase.length) {
          deleting = true;
          window.setTimeout(tick, 1600);
          return;
        }
        window.setTimeout(tick, 78);
        return;
      }
      count -= 1;
      tagline.textContent = phrase.slice(0, count);
      if (count === 0) {
        deleting = false;
        index = (index + 1) % phrases.length;
        window.setTimeout(tick, 280);
        return;
      }
      window.setTimeout(tick, 36);
    };

    window.setTimeout(tick, 900);
  }

  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  var closeNav = function () {
    if (!nav || !toggle) return;
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  };

  if (toggle && nav) {
    var toggleLabel = toggle.querySelector(".sr-only");
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      if (toggleLabel) toggleLabel.textContent = open ? "关闭菜单" : "打开菜单";
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
  }

  var chips = Array.prototype.slice.call(document.querySelectorAll("[data-filter]"));
  var cards = Array.prototype.slice.call(document.querySelectorAll(".card"));
  var status = document.getElementById("filter-status");
  var empty = document.getElementById("empty-filter");

  var applyFilter = function (key, chip) {
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
    if (status) {
      var label = chip ? chip.textContent.replace(/\s+/g, " ").trim() : "";
      status.textContent = visible + " 条视频" + (key === "all" ? "" : " · " + label);
    }
    if (empty) empty.hidden = visible !== 0;
    if (window.history && window.history.replaceState) {
      var url = new URL(window.location.href);
      if (key === "all") url.searchParams.delete("tag");
      else url.searchParams.set("tag", key);
      window.history.replaceState(null, "", url);
    }
  };

  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      var key = chip.getAttribute("data-filter") || "all";
      applyFilter(key, chip);
      var work = document.getElementById("work");
      if (!work) return;
      var top = work.getBoundingClientRect().top;
      if (top > window.innerHeight * 0.35) {
        work.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      }
    });
  });

  var params = new URLSearchParams(window.location.search);
  var initial = params.get("tag");
  if (initial) {
    var match = chips.filter(function (chip) {
      return chip.getAttribute("data-filter") === initial;
    })[0];
    if (match) applyFilter(initial, match);
  }

  document.querySelectorAll('a[href^="#v-"]').forEach(function (link) {
    link.addEventListener("click", function () {
      var all = chips.filter(function (chip) {
        return chip.getAttribute("data-filter") === "all";
      })[0];
      if (all) applyFilter("all", all);
    });
  });

  var copyButton = document.getElementById("copy-email");
  var email = "18131537762@163.com";
  if (copyButton) {
    copyButton.addEventListener("click", function () {
      var done = function (ok) {
        copyButton.dataset.state = ok ? "done" : "error";
        copyButton.textContent = ok ? "已复制" : "请手动选择邮箱";
        window.setTimeout(function () {
          copyButton.dataset.state = "";
          copyButton.textContent = "复制邮箱";
        }, 1800);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(email).then(function () {
          done(true);
        }).catch(function () {
          done(false);
        });
      } else {
        done(false);
      }
    });
  }
})();
