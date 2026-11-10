(function () {
  "use strict";

  var EGGS = ["avatar", "buddy", "konami", "word", "terminal", "pose", "game", "like", "weather", "theme"];
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var mobile = window.matchMedia("(max-width: 760px)").matches;

  function lang() {
    return window.siteLang && siteLang.get() === "en" ? "en" : "zh";
  }
  function tr(zh, en) {
    return lang() === "en" ? en : zh;
  }

  function loadEggs() {
    try {
      var raw = JSON.parse(localStorage.getItem("eggs") || "[]");
      return Array.isArray(raw) ? raw.filter(function (id) { return EGGS.indexOf(id) !== -1; }) : [];
    } catch (err) {
      return [];
    }
  }
  function saveEggs(list) {
    try { localStorage.setItem("eggs", JSON.stringify(list)); } catch (err) { /* ignore */ }
  }
  var found = loadEggs();

  var toastEl = document.createElement("p");
  toastEl.id = "egg-toast";
  toastEl.className = "egg-toast";
  toastEl.setAttribute("role", "status");
  toastEl.hidden = true;
  document.body.appendChild(toastEl);
  var toastTimer = 0;

  function updateCount() {
    var text = tr("彩蛋 " + found.length + "/" + EGGS.length, "Easter eggs found: " + found.length + "/" + EGGS.length);
    document.querySelectorAll("[data-egg-count]").forEach(function (el) { el.textContent = text; });
  }
  function toast(text) {
    toastEl.textContent = text;
    toastEl.hidden = false;
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () { toastEl.hidden = true; }, 2600);
  }
  function foundEgg(id) {
    if (EGGS.indexOf(id) === -1 || found.indexOf(id) !== -1) return;
    found.push(id);
    saveEggs(found);
    updateCount();
    toast(tr("彩蛋 " + found.length + "/" + EGGS.length, "Easter eggs found: " + found.length + "/" + EGGS.length));
  }
  window.foundEgg = foundEgg;
  updateCount();
  document.addEventListener("site-lang", updateCount);

  console.log(
    "\n      [o_o]\n     /|___|\\\n      d   b\n     /|   |\\\n   muxintian · Mwaitwait\n   embodied AI · computer vision\n   " +
    tr("你好。页面里藏了几个小惊喜。", "Hello. A few surprises are hidden in this page.") +
    "\n"
  );

  /* ---------- weather ---------- */
  var MODES = ["sunny", "rain", "snow", "thunder", "night", "clear"];
  var MODE_ICON = { sunny: "☀", rain: "☂", snow: "❄", thunder: "⚡", night: "✦", clear: "◌" };
  var MODE_NAME = {
    sunny: ["晴", "Sunny"],
    rain: ["雨", "Rain"],
    snow: ["雪", "Snow"],
    thunder: ["雷雨", "Thunder"],
    night: ["夜", "Night"],
    clear: ["无", "Clear"]
  };
  var weatherMode = "clear";
  var canvas = document.createElement("canvas");
  canvas.id = "weather";
  canvas.setAttribute("aria-hidden", "true");
  document.body.prepend(canvas);
  var ctx = canvas.getContext("2d", { alpha: true });
  var drops = [];
  var running = !document.hidden;
  var flash = 0;

  function resizeCanvas() {
    if (!ctx) return;
    var w = document.documentElement.clientWidth || window.innerWidth;
    var h = window.innerHeight;
    var dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1 : 1.5);
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  function capFor(mode) {
    if (reduce || mode === "clear") return 0;
    if (mobile) return mode === "night" ? 24 : 22;
    if (mode === "sunny") return 32;
    if (mode === "night") return 70;
    return 80;
  }
  function seedWeather() {
    drops = [];
    var n = capFor(weatherMode);
    for (var i = 0; i < n; i += 1) {
      drops.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        v: 0.35 + Math.random() * 1.4,
        r: 0.8 + Math.random() * 2.2,
        p: Math.random() * Math.PI * 2
      });
    }
  }
  function paintWeatherButton() {
    var btn = document.getElementById("weather-toggle");
    if (!btn) return;
    var pair = MODE_NAME[weatherMode] || MODE_NAME.clear;
    btn.textContent = MODE_ICON[weatherMode] || "◌";
    btn.setAttribute("aria-label", tr("天气：" + pair[0] + "，点击切换", "Weather: " + pair[1] + ", click to cycle"));
  }
  function setWeather(mode, manual) {
    if (mode === "auto") {
      try { localStorage.removeItem("weather"); } catch (err) { /* ignore */ }
      detectWeather();
      return;
    }
    if (MODES.indexOf(mode) === -1) return;
    weatherMode = mode;
    if (manual) {
      try { localStorage.setItem("weather", mode); } catch (err) { /* ignore */ }
      foundEgg("weather");
    }
    seedWeather();
    paintWeatherButton();
  }
  window.setWeather = function (mode) { setWeather(mode, true); };

  function byClock() {
    var hour = new Date().getHours();
    setWeather(hour >= 7 && hour < 19 ? "sunny" : "night", false);
  }
  function mapCode(code, isDay) {
    if (code >= 95) return "thunder";
    if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow";
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
    if (code <= 3) return isDay ? "sunny" : "night";
    return isDay ? "clear" : "night";
  }
  function detectWeather() {
    var saved = null;
    try { saved = localStorage.getItem("weather"); } catch (err) { saved = null; }
    if (saved && MODES.indexOf(saved) !== -1) {
      setWeather(saved, false);
      return;
    }
    var ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
    var timer = window.setTimeout(function () { if (ctrl) ctrl.abort(); }, 2800);
    var signal = ctrl ? ctrl.signal : undefined;
    fetch("https://get.geojs.io/v1/ip/geo.json", { signal: signal })
      .then(function (res) { if (!res.ok) throw new Error("geo"); return res.json(); })
      .then(function (geo) {
        var lat = parseFloat(geo.latitude);
        var lon = parseFloat(geo.longitude);
        if (!isFinite(lat) || !isFinite(lon)) throw new Error("geo");
        return fetch(
          "https://api.open-meteo.com/v1/forecast?latitude=" + lat + "&longitude=" + lon + "&current=weather_code,is_day",
          { signal: signal }
        );
      })
      .then(function (res) { if (!res.ok) throw new Error("wx"); return res.json(); })
      .then(function (data) {
        window.clearTimeout(timer);
        var savedNow = null;
        try { savedNow = localStorage.getItem("weather"); } catch (err) { savedNow = null; }
        if (savedNow && MODES.indexOf(savedNow) !== -1) return;
        var cur = data && data.current;
        if (!cur || typeof cur.weather_code !== "number") throw new Error("wx");
        setWeather(mapCode(cur.weather_code, cur.is_day !== 0), false);
      })
      .catch(function () {
        window.clearTimeout(timer);
        byClock();
      });
  }

  var weatherBtn = document.getElementById("weather-toggle");
  if (weatherBtn) {
    weatherBtn.addEventListener("click", function () {
      var i = MODES.indexOf(weatherMode);
      setWeather(MODES[(i + 1) % MODES.length], true);
    });
  }
  detectWeather();

  /* ---------- theme ---------- */
  function applyTheme(theme, manual) {
    var next = theme === "day" ? "day" : "night";
    document.documentElement.setAttribute("data-theme", next);
    if (manual) {
      try { localStorage.setItem("theme", next); } catch (err) { /* ignore */ }
      foundEgg("theme");
    }
    var btn = document.getElementById("theme-toggle");
    if (btn) {
      btn.textContent = next === "day" ? "☾" : "☀";
      btn.setAttribute("aria-label", tr(next === "day" ? "切换到夜间" : "切换到日间", next === "day" ? "Switch to night" : "Switch to day"));
    }
  }
  var savedTheme = null;
  try { savedTheme = localStorage.getItem("theme"); } catch (err) { savedTheme = null; }
  applyTheme(savedTheme === "day" ? "day" : "night", false);
  window.setTheme = function (theme) { applyTheme(theme, true); };
  var themeBtn = document.getElementById("theme-toggle");
  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      var cur = document.documentElement.getAttribute("data-theme") === "day" ? "day" : "night";
      applyTheme(cur === "day" ? "night" : "day", true);
    });
  }

  /* ---------- cursor robot ---------- */
  var bot = null;
  var bx = 80;
  var by = 80;
  var tx = 80;
  var ty = 80;
  var buddyClicks = 0;
  if (finePointer && !reduce) {
    bot = document.createElement("button");
    bot.type = "button";
    bot.className = "cursor-bot";
    bot.setAttribute("aria-label", tr("点这只小机器人", "Click the little robot"));
    bot.innerHTML =
      '<svg viewBox="0 0 64 72" width="54" height="60" aria-hidden="true">' +
      '<g class="bot-antenna"><rect x="30" y="4" width="4" height="10" rx="2" fill="#ffe08a"/><circle cx="32" cy="4" r="4" fill="#ff8ab3"/></g>' +
      '<rect x="14" y="14" width="36" height="26" rx="10" fill="#7aefff"/>' +
      '<circle cx="24" cy="26" r="3.2" fill="#12182b"/><circle cx="40" cy="26" r="3.2" fill="#12182b"/>' +
      '<g class="arm arm-l"><rect x="4" y="24" width="12" height="5" rx="2.5" fill="#c4b5fd"/></g>' +
      '<g class="arm arm-r"><rect x="48" y="24" width="12" height="5" rx="2.5" fill="#c4b5fd"/></g>' +
      '<rect x="18" y="42" width="28" height="16" rx="7" fill="#ffb15a"/>' +
      '<circle cx="24" cy="62" r="5" fill="#f6f8ff"/><circle cx="40" cy="62" r="5" fill="#f6f8ff"/>' +
      "</svg>";
    document.body.appendChild(bot);
    document.addEventListener("mousemove", function (event) {
      tx = event.clientX + 16;
      ty = event.clientY + 20;
    });
    bot.addEventListener("click", function (event) {
      event.stopPropagation();
      buddyClicks += 1;
      bot.classList.add("trick");
      window.setTimeout(function () { bot.classList.remove("trick"); }, 700);
      if (buddyClicks >= 4) foundEgg("buddy");
    });
    document.addEventListener("site-lang", function () {
      bot.setAttribute("aria-label", tr("点这只小机器人", "Click the little robot"));
    });
  }

  /* ---------- avatar ---------- */
  var avatarBtn = document.getElementById("avatar-btn");
  if (avatarBtn) {
    avatarBtn.addEventListener("click", function () {
      foundEgg("avatar");
      var img = avatarBtn.querySelector(".avatar");
      if (img && !reduce) {
        img.classList.remove("is-pop");
        void img.offsetWidth;
        img.classList.add("is-pop");
      }
      if (!reduce) {
        var rect = avatarBtn.getBoundingClientRect();
        var cx = rect.left + rect.width / 2;
        var cy = rect.top + rect.height / 2;
        ["✨", "🤖", "⭐", "🎉", "💫", "👀"].forEach(function (emo, i) {
          var node = document.createElement("span");
          node.className = "burst";
          node.textContent = emo;
          node.style.left = cx + "px";
          node.style.top = cy + "px";
          var ang = (Math.PI * 2 * i) / 6;
          node.style.setProperty("--dx", Math.cos(ang) * 74 + "px");
          node.style.setProperty("--dy", Math.sin(ang) * 74 + "px");
          document.body.appendChild(node);
          window.setTimeout(function () { node.remove(); }, 800);
        });
      }
      if (bot) {
        bot.classList.add("wave");
        window.setTimeout(function () { bot.classList.remove("wave"); }, 1400);
      }
    });
  }

  function confetti() {
    if (reduce) return;
    for (var i = 0; i < 28; i += 1) {
      var bit = document.createElement("i");
      bit.className = "confetti";
      bit.style.left = Math.random() * 100 + "vw";
      bit.style.background = ["#ff8ab3", "#7aefff", "#ffe08a", "#c4b5fd", "#86efac"][i % 5];
      bit.style.animationDelay = Math.random() * 0.2 + "s";
      document.body.appendChild(bit);
      window.setTimeout(function (node) { node.remove(); }, 1600, bit);
    }
  }

  /* ---------- konami + secret words ---------- */
  var konami = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
  var konamiAt = 0;
  var typed = "";
  function typingTarget(target) {
    if (!target) return false;
    var tag = (target.tagName || "").toLowerCase();
    return tag === "input" || tag === "textarea" || target.isContentEditable;
  }
  document.addEventListener("keydown", function (event) {
    if (event.key === "`" && !typingTarget(event.target)) {
      event.preventDefault();
      toggleTerminal();
      return;
    }
    if (event.key === "Escape") {
      var term = document.getElementById("terminal");
      if (term && !term.hidden) {
        term.hidden = true;
        return;
      }
    }
    if (typingTarget(event.target) || event.metaKey || event.ctrlKey || event.altKey) return;
    var key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    var expect = konami[konamiAt];
    if (key === expect) {
      konamiAt += 1;
      if (konamiAt === konami.length) {
        konamiAt = 0;
        foundEgg("konami");
        confetti();
        if (bot) {
          bot.classList.add("dance");
          window.setTimeout(function () { bot.classList.remove("dance"); }, 2400);
        }
        openGame();
      }
    } else {
      konamiAt = key === konami[0] ? 1 : 0;
    }
    if (event.key.length === 1 && /[a-z]/i.test(event.key)) {
      typed = (typed + event.key.toLowerCase()).slice(-16);
      if (typed.endsWith("robot") || typed.endsWith("ros")) {
        typed = "";
        foundEgg("word");
        if (bot) {
          bot.classList.add("trick");
          window.setTimeout(function () { bot.classList.remove("trick"); }, 700);
        }
        toast(tr("收到：robot / ros", "Heard: robot / ros"));
      }
    }
  });

  /* ---------- terminal ---------- */
  var term = document.createElement("div");
  term.id = "terminal";
  term.hidden = true;
  term.innerHTML =
    '<div class="term-bar"><span class="term-dots" aria-hidden="true"></span><span>isaac-sim</span><em>ros2</em><button type="button" id="term-close" aria-label="Close">×</button></div>' +
    '<div id="term-log" role="log"></div>' +
    '<form id="term-form"><span class="term-prompt" aria-hidden="true">ros2&gt;</span><input id="term-in" autocomplete="off" spellcheck="false"></form>';
  document.body.appendChild(term);
  var termLog = document.getElementById("term-log");
  var termIn = document.getElementById("term-in");

  function termLine(text, cls) {
    var row = document.createElement("p");
    if (cls) row.className = cls;
    row.textContent = text;
    termLog.appendChild(row);
    termLog.scrollTop = termLog.scrollHeight;
  }
  function helpText() {
    [
      "help",
      "whoami",
      "ls projects",
      "ros2 topic list",
      "ros2 topic echo /pose_6d",
      "ros2 run muxintian hello | game | scene | graph",
      "open <dual-arm|pose|isaac|scene|graph>",
      "skill <ros2|nav2|moveit|isaac|pose|foundationpose|realsense|orbbec|dual|mobile|openclaw|llm>",
      "graph",
      "weather <sunny|rain|snow|thunder|night|clear|auto>",
      "theme [day|night]",
      "sudo make coffee",
      "clear"
    ].forEach(function (line) { termLine(line); });
  }
  function sitePrefix() {
    return location.pathname.indexOf("/projects/") !== -1 ? "../" : "";
  }
  function goHash(id) {
    var el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
      return;
    }
    location.href = sitePrefix() + "index.html#" + id;
  }
  function openPage(file) {
    location.href = sitePrefix() + file;
  }
  function focusSkill(key) {
    var chip = document.querySelector('[data-filter="' + key + '"]');
    if (chip) {
      chip.click();
      if (window.highlightGraph) window.highlightGraph(key);
      return;
    }
    location.href = sitePrefix() + "index.html?tag=" + encodeURIComponent(key) + "#work";
  }
  var skillAlias = {
    ros2: "ros2", "ros": "ros2", nav2: "nav2", moveit: "moveit", "moveit2": "moveit",
    isaac: "isaac", pose: "pose", "6d": "pose", foundationpose: "foundationpose",
    realsense: "realsense", orbbec: "orbbec", dual: "dual", mobile: "mobile",
    openclaw: "openclaw", llm: "llm", gpt: "llm"
  };
  var projectAlias = {
    "dual-arm": "projects/dual-arm-loading.html",
    dual: "projects/dual-arm-loading.html",
    pose: "projects/pose-6d.html",
    "pose-6d": "projects/pose-6d.html",
    isaac: "projects/isaac-nav2.html",
    "isaac-nav2": "projects/isaac-nav2.html",
    nav2: "projects/isaac-nav2.html"
  };
  function runCommand(raw) {
    var line = raw.trim().replace(/\s+/g, " ");
    termLine("ros2> " + line, "cmd");
    var lower = line.toLowerCase();
    if (!lower) return;
    if (lower === "help") helpText();
    else if (lower === "clear") termLog.textContent = "";
    else if (lower === "whoami") {
      termLine("muxintian");
      termLine("Bilibili: Mwaitwait · 270 followers · space.bilibili.com/698231403");
      termLine(tr("25 岁 · 研三研究生", "age 25 · third-year graduate student"));
      termLine(tr("具身智能 · 计算机视觉", "embodied AI · computer vision"));
      termLine("mail: 18131537762@163.com");
      termLine("github.com/mwaiting002");
    } else if (lower === "ls" || lower === "ls projects") {
      termLine("projects/dual-arm-loading    " + tr("双臂机器人工厂上下料", "dual-arm factory loading"));
      termLine("projects/pose-6d             " + tr("6D 姿态（传统 + FoundationPose）", "6D pose (classical + FoundationPose)"));
      termLine("projects/isaac-nav2          Isaac Sim + Nav2");
    } else if (lower === "ros2 topic list") {
      termLine(tr("# 不是在线图，名字来自视频简介", "# not a live graph — names from the video notes"));
      ["/camera/realsense_d415", "/camera/gemini_335", "/pose_6d", "/moveit/plan", "/nav2", "/openclaw/cmd"].forEach(termLine);
    } else if (lower === "ros2 topic echo /pose_6d") {
      termLine(tr("没有在线发布者。笔记在 projects/pose-6d。", "No live publisher. Notes are in projects/pose-6d."));
      termLine(tr("RealSense D415 · FoundationPose ROS 2 · 奥比中光 Gemini 335", "RealSense D415 · FoundationPose ROS 2 · Orbbec Gemini 335"));
    } else if (lower === "ros2 run muxintian hello") {
      termLine("hello from muxintian");
      termLine(tr("研三 · 具身智能 · 计算机视觉", "graduate student · embodied AI · computer vision"));
    } else if (lower === "ros2 run muxintian game") {
      termLine(tr("打开接星星的小游戏。", "Opening the star-catching game."));
      openGame();
    } else if (lower === "ros2 run muxintian scene" || lower === "ros2 launch scene") {
      termLine(tr("转到实验台场景。", "Opening the lab scene."));
      goHash("bench");
    } else if (lower === "ros2 run muxintian graph" || lower === "graph" || lower === "skill" || lower === "skill graph") {
      termLine(tr("转到技能图。", "Opening the skill graph."));
      goHash("skill-graph");
    } else if (lower.indexOf("open ") === 0) {
      var what = lower.slice(5);
      if (what === "scene" || what === "bench") goHash("bench");
      else if (what === "graph") goHash("skill-graph");
      else if (projectAlias[what]) openPage(projectAlias[what]);
      else termLine(tr("可打开：dual-arm, pose, isaac, scene, graph", "open: dual-arm, pose, isaac, scene, graph"));
    } else if (lower.indexOf("skill ") === 0) {
      var key = skillAlias[lower.slice(6)];
      if (!key) termLine(tr("没有这个节点。输入 skill 看图。", "No such node. Try: graph"));
      else {
        termLine("skill " + key);
        focusSkill(key);
      }
    } else if (lower === "theme") {
      var cur = document.documentElement.getAttribute("data-theme") === "day" ? "night" : "day";
      applyTheme(cur, true);
      termLine("theme " + cur);
    } else if (lower === "theme day" || lower === "theme night") {
      applyTheme(lower.split(" ")[1], true);
      termLine("theme " + lower.split(" ")[1]);
    } else if (lower.indexOf("weather ") === 0) {
      var mode = lower.split(" ")[1];
      if (mode === "auto" || MODES.indexOf(mode) !== -1) {
        setWeather(mode, mode !== "auto");
        if (mode === "auto") foundEgg("weather");
        termLine("weather " + (mode === "auto" ? weatherMode + " (auto)" : mode));
      } else termLine(tr("用法：weather sunny|rain|snow|thunder|night|clear|auto", "usage: weather sunny|rain|snow|thunder|night|clear|auto"));
    } else if (lower === "sudo make coffee") {
      termLine(tr("咖啡不在任何一条视频简介里。", "Coffee is not in any video description."));
      termLine(tr("试试：ros2 run muxintian hello", "try: ros2 run muxintian hello"));
    } else termLine(tr("没有这条命令。输入 help。", "command not found. try help."));
  }

  function toggleTerminal() {
    term.hidden = !term.hidden;
    if (!term.hidden) {
      foundEgg("terminal");
      if (!termLog.childElementCount) helpText();
      termIn.focus();
      termIn.setAttribute("aria-label", tr("终端命令", "Terminal command"));
    }
  }
  document.getElementById("term-close").addEventListener("click", function () { term.hidden = true; });
  document.getElementById("term-form").addEventListener("submit", function (event) {
    event.preventDefault();
    runCommand(termIn.value);
    termIn.value = "";
  });
  var termToggle = document.getElementById("term-toggle");
  if (termToggle) termToggle.addEventListener("click", toggleTerminal);

  /* ---------- pose gag ---------- */
  var pose = document.getElementById("pose-stage");
  if (pose) {
    function pokePose() { foundEgg("pose"); }
    pose.addEventListener("mouseenter", pokePose);
    pose.addEventListener("focus", pokePose);
    pose.addEventListener("click", pokePose);
  }

  /* ---------- like ---------- */
  var likeBtn = document.getElementById("like-btn");
  var likeCount = document.getElementById("like-count");
  var likes = 0;
  try { likes = parseInt(localStorage.getItem("likes") || "0", 10) || 0; } catch (err) { likes = 0; }
  function paintLikes() { if (likeCount) likeCount.textContent = String(likes); }
  paintLikes();
  if (likeBtn) {
    likeBtn.addEventListener("click", function () {
      likes += 1;
      try { localStorage.setItem("likes", String(likes)); } catch (err) { /* ignore */ }
      paintLikes();
      foundEgg("like");
      if (reduce) return;
      var rect = likeBtn.getBoundingClientRect();
      for (var i = 0; i < 6; i += 1) {
        var heart = document.createElement("span");
        heart.className = "heart";
        heart.textContent = "♥";
        heart.style.left = rect.left + rect.width / 2 + "px";
        heart.style.top = rect.top + "px";
        heart.style.setProperty("--dx", (i - 2.5) * 16 + "px");
        document.body.appendChild(heart);
        window.setTimeout(function (node) { node.remove(); }, 700, heart);
      }
    });
  }

  /* ---------- facts ---------- */
  var facts = [
    ["公开视频一共 12 条，从 2025 年 10 月到 2026 年 9 月。", "There are 12 public videos, from October 2025 to September 2026."],
    ["Bilibili 昵称 Mwaitwait，关注者 270。", "The Bilibili name is Mwaitwait, with 270 followers."],
    ["深度学习版 6D 姿态用 RealSense D415 和 FoundationPose 的 ROS 2 版本。CAD 来自腾讯混元，再微调。", "The deep 6D pose video uses a RealSense D415 and the ROS 2 build of FoundationPose. The CAD model comes from Tencent Hunyuan, then a modeling-tool tweak."],
    ["传统 6D 姿态用奥比中光 Gemini 335，方法是特征点匹配加深度法向量。", "The classical 6D pose video uses an Orbbec Gemini 335: feature matching plus depth normals."],
    ["Isaac Sim 那条视频的简介只有一句：在英伟达的 Isaac Sim 里部署 Nav2。", "The Isaac Sim video's description is one sentence: Nav2 is deployed inside NVIDIA Isaac Sim."],
    ["OpenClaw 那条是三层：OpenClaw 与 GPT，Node.js / ROS 2 / C++ 桥，MoveIt 2 规划。", "The OpenClaw video is three layers: OpenClaw and GPT, a Node.js / ROS 2 / C++ bridge, and MoveIt 2 planning."],
    ["移动抓取那条写的是机械臂视觉规控，加上小车自主导航，分层架构。", "The mobile pick-and-deliver video describes arm visual planning plus base navigation, in layers."],
    ["6D 视觉定位加 MoveIt 2 那条，简介只写了 Ubuntu 22.04 和 ROS 2 Humble。", "The 6D localization plus MoveIt 2 video only notes Ubuntu 22.04 and ROS 2 Humble."],
    ["获奖条目只有这一条：中国机器人及人工智能大赛，国家一等奖。页面上没有写年份。", "The only award listed is a national first prize in the China Robot and Artificial Intelligence Competition. No year is shown."]
  ];
  var factAt = 0;
  var factBody = document.getElementById("fact-body");
  function paintFact() {
    if (!factBody) return;
    factBody.textContent = facts[factAt][lang() === "en" ? 1 : 0];
  }
  paintFact();
  document.addEventListener("site-lang", paintFact);
  var factBtn = document.getElementById("fact-next");
  if (factBtn) factBtn.addEventListener("click", function () {
    factAt = (factAt + 1) % facts.length;
    paintFact();
  });

  /* ---------- IK arm ---------- */
  var arm = document.getElementById("arm-svg");
  if (arm) {
    var link1 = arm.querySelector("#link1");
    var link2 = arm.querySelector("#link2");
    var j0 = arm.querySelector("#j0");
    var j1 = arm.querySelector("#j1");
    var tip = arm.querySelector("#tip");
    var L1 = 78;
    var L2 = 64;
    var base = { x: 70, y: 168 };
    var aim = { x: 150, y: 80 };
    var cur = { x: 150, y: 80 };
    function ik(target) {
      var dx = target.x - base.x;
      var dy = target.y - base.y;
      var dist = Math.hypot(dx, dy);
      var max = L1 + L2 - 1;
      var min = Math.abs(L1 - L2) + 1;
      dist = Math.max(min, Math.min(max, dist));
      var ang = Math.atan2(dy, dx);
      var cosA = (L1 * L1 + dist * dist - L2 * L2) / (2 * L1 * dist);
      var cosB = (L1 * L1 + L2 * L2 - dist * dist) / (2 * L1 * L2);
      cosA = Math.max(-1, Math.min(1, cosA));
      cosB = Math.max(-1, Math.min(1, cosB));
      var a1 = ang - Math.acos(cosA);
      var a2 = Math.acos(cosB);
      var x1 = base.x + Math.cos(a1) * L1;
      var y1 = base.y + Math.sin(a1) * L1;
      var x2 = x1 + Math.cos(a1 + a2) * L2;
      var y2 = y1 + Math.sin(a1 + a2) * L2;
      link1.setAttribute("x1", base.x); link1.setAttribute("y1", base.y);
      link1.setAttribute("x2", x1); link1.setAttribute("y2", y1);
      link2.setAttribute("x1", x1); link2.setAttribute("y1", y1);
      link2.setAttribute("x2", x2); link2.setAttribute("y2", y2);
      j0.setAttribute("cx", base.x); j0.setAttribute("cy", base.y);
      j1.setAttribute("cx", x1); j1.setAttribute("cy", y1);
      tip.setAttribute("cx", x2); tip.setAttribute("cy", y2);
    }
    function toLocal(event) {
      var rect = arm.getBoundingClientRect();
      var x = ((event.clientX - rect.left) / rect.width) * 320;
      var y = ((event.clientY - rect.top) / rect.height) * 220;
      aim.x = Math.max(8, Math.min(312, x));
      aim.y = Math.max(8, Math.min(212, y));
    }
    arm.addEventListener("pointermove", toLocal);
    arm.addEventListener("pointerdown", toLocal);
    ik(cur);
    window.setInterval(function () {
      cur.x += (aim.x - cur.x) * 0.2;
      cur.y += (aim.y - cur.y) * 0.2;
      ik(cur);
    }, reduce ? 200 : 32);
  }

  /* ---------- game ---------- */
  var game = document.createElement("div");
  game.id = "game";
  game.hidden = true;
  game.innerHTML =
    '<div class="game-card" role="dialog" aria-modal="true">' +
    '<div class="game-top"><strong id="game-title"></strong><button type="button" id="game-close">×</button></div>' +
    '<p id="game-help"></p><p id="game-score"></p>' +
    '<div id="game-field"><span id="game-bot">🤖</span></div>' +
    '<button type="button" id="game-start"></button></div>';
  document.body.appendChild(game);
  var field = document.getElementById("game-field");
  var gbot = document.getElementById("game-bot");
  var scoreEl = document.getElementById("game-score");
  var stars = [];
  var gScore = 0;
  var gLeft = 0;
  var gTimer = 0;
  var gLoop = 0;
  var playing = false;
  var gx = 50;

  function highScore() {
    try { return parseInt(localStorage.getItem("game-high") || "0", 10) || 0; } catch (err) { return 0; }
  }
  function paintGameText() {
    document.getElementById("game-title").textContent = tr("接星星", "Catch the stars");
    document.getElementById("game-help").textContent = tr(
      "小机器人跟着指针走。接到星星得分。最高分只存在这台浏览器里。",
      "The robot follows the pointer. Catch stars. The high score stays in this browser."
    );
    document.getElementById("game-start").textContent = playing
      ? tr("进行中", "Playing")
      : tr("开始 20 秒", "Start 20s");
    document.getElementById("game-close").setAttribute("aria-label", tr("关闭游戏", "Close game"));
    if (!playing) scoreEl.textContent = tr("分数 0 · 最高 " + highScore(), "Score 0 · best " + highScore());
  }
  function openGame() {
    game.hidden = false;
    paintGameText();
    foundEgg("game");
  }
  window.openGame = openGame;
  function stopGame() {
    playing = false;
    window.clearInterval(gTimer);
    window.clearInterval(gLoop);
    stars.forEach(function (star) { star.el.remove(); });
    stars = [];
    paintGameText();
    scoreEl.textContent = tr("分数 " + gScore + " · 最高 " + highScore(), "Score " + gScore + " · best " + highScore());
  }
  function startGame() {
    stopGame();
    playing = true;
    gScore = 0;
    gLeft = 20;
    gx = 50;
    gbot.style.left = "50%";
    paintGameText();
    scoreEl.textContent = tr("分数 0 · 还剩 20 秒", "Score 0 · 20s left");
    gTimer = window.setInterval(function () {
      if (document.hidden) return;
      gLeft -= 1;
      if (gLeft <= 0) {
        var best = highScore();
        if (gScore > best) {
          best = gScore;
          try { localStorage.setItem("game-high", String(best)); } catch (err) { /* ignore */ }
        }
        stopGame();
        scoreEl.textContent = tr("结束。分数 " + gScore + " · 最高 " + best, "Done. Score " + gScore + " · best " + best);
      }
    }, 1000);
    gLoop = window.setInterval(function () {
      if (!playing || document.hidden) return;
      if (Math.random() < 0.45) {
        var el = document.createElement("i");
        el.className = "star";
        el.textContent = "✦";
        var x = 8 + Math.random() * 84;
        el.style.left = x + "%";
        field.appendChild(el);
        stars.push({ el: el, x: x, y: 0 });
      }
      stars = stars.filter(function (star) {
        star.y += mobile ? 4 : 3.2;
        star.el.style.top = star.y + "%";
        var hit = star.y > 78 && Math.abs(star.x - gx) < 10;
        if (hit) {
          gScore += 1;
          scoreEl.textContent = tr("分数 " + gScore + " · 还剩 " + gLeft + " 秒", "Score " + gScore + " · " + gLeft + "s left");
        }
        if (hit || star.y > 100) {
          star.el.remove();
          return false;
        }
        return true;
      });
    }, reduce ? 80 : 50);
  }
  function moveBot(clientX) {
    var rect = field.getBoundingClientRect();
    var x = ((clientX - rect.left) / rect.width) * 100;
    gx = Math.max(6, Math.min(94, x));
    gbot.style.left = gx + "%";
  }
  field.addEventListener("pointermove", function (event) { moveBot(event.clientX); });
  field.addEventListener("pointerdown", function (event) { moveBot(event.clientX); });
  document.getElementById("game-start").addEventListener("click", function () { if (!playing) startGame(); });
  document.getElementById("game-close").addEventListener("click", function () { stopGame(); game.hidden = true; });
  document.addEventListener("site-lang", function () { if (!playing) paintGameText(); });

  /* ---------- animation frame ---------- */
  document.addEventListener("visibilitychange", function () { running = !document.hidden; });
  function drawWeather() {
    if (!ctx) return;
    var w = window.innerWidth;
    var h = window.innerHeight;
    ctx.clearRect(0, 0, w, h);
    if (!running || reduce || weatherMode === "clear") return;
    var i;
    if (weatherMode === "sunny") {
      ctx.strokeStyle = "rgba(255, 224, 138, 0.28)";
      ctx.lineWidth = mobile ? 8 : 14;
      for (i = 0; i < (mobile ? 3 : 5); i += 1) {
        ctx.beginPath();
        ctx.moveTo(w * (0.55 + i * 0.08), -10);
        ctx.lineTo(w * (0.2 + i * 0.1), h + 10);
        ctx.stroke();
      }
      drops.forEach(function (d) {
        d.y -= d.v * 0.6;
        d.x += Math.sin(d.p + d.y * 0.01) * 0.3;
        if (d.y < -8) { d.y = h + 8; d.x = Math.random() * w; }
        ctx.fillStyle = "rgba(255, 224, 138, 0.85)";
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fill();
      });
    } else if (weatherMode === "rain" || weatherMode === "thunder") {
      ctx.strokeStyle = "rgba(180, 220, 255, 0.75)";
      ctx.lineWidth = 1.4;
      drops.forEach(function (d) {
        d.y += 6 + d.v * 6;
        d.x += 1.2;
        if (d.y > h) { d.y = -10; d.x = Math.random() * w; }
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - 3, d.y - 12);
        ctx.stroke();
      });
      if (weatherMode === "thunder" && !mobile) {
        if (flash <= 0 && Math.random() < 0.008) flash = 1;
        if (flash > 0) {
          ctx.fillStyle = "rgba(255,255,255," + (flash * 0.28).toFixed(3) + ")";
          ctx.fillRect(0, 0, w, h);
          flash *= 0.86;
          if (flash < 0.04) flash = 0;
        }
      }
    } else if (weatherMode === "snow") {
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      drops.forEach(function (d) {
        d.y += 0.6 + d.v;
        d.x += Math.sin(d.p + d.y * 0.02) * 0.6;
        if (d.y > h) { d.y = -6; d.x = Math.random() * w; }
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r + 0.6, 0, Math.PI * 2);
        ctx.fill();
      });
    } else if (weatherMode === "night") {
      drops.forEach(function (d, idx) {
        d.p += 0.02;
        var alpha = 0.35 + Math.abs(Math.sin(d.p)) * 0.65;
        var firefly = idx % 9 === 0;
        ctx.fillStyle = firefly ? "rgba(255, 224, 138," + alpha + ")" : "rgba(255,255,255," + alpha + ")";
        if (firefly) {
          d.x += Math.sin(d.p) * 0.4;
          d.y += Math.cos(d.p * 0.7) * 0.25;
        }
        ctx.beginPath();
        ctx.arc(d.x, d.y, firefly ? d.r + 1.2 : d.r * 0.7, 0, Math.PI * 2);
        ctx.fill();
      });
    }
  }
  function frame() {
    if (bot) {
      bx += (tx - bx) * 0.14;
      by += (ty - by) * 0.14;
      bot.style.transform = "translate(" + bx + "px," + by + "px)";
    }
    drawWeather();
    window.requestAnimationFrame(frame);
  }
  if (!reduce) window.requestAnimationFrame(frame);
  else if (canvas) canvas.style.display = "none";
})();
