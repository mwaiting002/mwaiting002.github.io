(function () {
  "use strict";

  var svg = document.getElementById("skill-graph");
  var note = document.getElementById("graph-note");
  if (!svg) return;

  function tr(zh, en) {
    return window.siteLang && siteLang.get() === "en" ? en : zh;
  }

  var nodes = [
    { id: "vision", zh: "视觉", en: "Vision", x: 70, y: 210, filter: "pose" },
    { id: "pose", zh: "6D 姿态", en: "6D pose", x: 210, y: 210, filter: "pose" },
    { id: "fp", zh: "FoundationPose", en: "FoundationPose", x: 200, y: 70, filter: "foundationpose" },
    { id: "rs", zh: "RealSense", en: "RealSense", x: 90, y: 80, filter: "realsense" },
    { id: "ob", zh: "Orbbec", en: "Orbbec", x: 90, y: 340, filter: "orbbec" },
    { id: "moveit", zh: "MoveIt 2", en: "MoveIt 2", x: 340, y: 150, filter: "moveit" },
    { id: "dual", zh: "双臂", en: "Dual-arm", x: 470, y: 90, filter: "dual" },
    { id: "mobile", zh: "移动操作", en: "Mobile manip.", x: 490, y: 200, filter: "mobile" },
    { id: "nav", zh: "Nav2", en: "Nav2", x: 470, y: 320, filter: "nav2" },
    { id: "isaac", zh: "Isaac Sim", en: "Isaac Sim", x: 590, y: 320, filter: "isaac" },
    { id: "ros", zh: "ROS 2", en: "ROS 2", x: 340, y: 250, filter: "ros2" },
    { id: "claw", zh: "OpenClaw", en: "OpenClaw", x: 560, y: 70, filter: "openclaw" },
    { id: "llm", zh: "GPT", en: "GPT", x: 590, y: 160, filter: "llm" }
  ];
  var edges = [
    ["vision", "pose"], ["pose", "fp"], ["pose", "rs"], ["pose", "ob"],
    ["pose", "moveit"], ["moveit", "dual"], ["moveit", "mobile"], ["mobile", "nav"],
    ["nav", "isaac"], ["ros", "pose"], ["ros", "moveit"], ["ros", "nav"], ["ros", "isaac"],
    ["ros", "claw"], ["claw", "llm"], ["claw", "moveit"]
  ];
  var blurbs = {
    vision: ["页面上的视觉工作主要是 6D 姿态。", "The vision work on this page is the 6D pose videos."],
    pose: ["同一天的两条视频：FoundationPose，以及特征点匹配加深度法向量。", "Two videos the same day: FoundationPose, and feature matching plus depth normals."],
    fp: ["深度学习版使用 FoundationPose 的 ROS 2 版本。", "The deep-learning video uses the ROS 2 build of FoundationPose."],
    rs: ["深度学习版的相机是 RealSense D415。", "The deep-learning video uses a RealSense D415."],
    ob: ["传统版的相机是奥比中光 Gemini 335。", "The classical video uses an Orbbec Gemini 335."],
    moveit: ["MoveIt 2 出现在 OpenClaw 视频和 6D 定位规划视频里。", "MoveIt 2 is in the OpenClaw video and the 6D localization video."],
    dual: ["双臂上下料。那条视频没有文字简介。", "Dual-arm loading. That video has no written description."],
    mobile: ["移动抓取的简介是机械臂视觉规控，加上小车自主导航。", "The mobile video says arm visual planning plus base navigation."],
    nav: ["Nav2 出现在 Isaac Sim 视频和导航教程里。", "Nav2 is in the Isaac Sim video and the navigation tutorial."],
    isaac: ["简介：在英伟达的 Isaac Sim 里部署 Nav2。", "The note says Nav2 is deployed inside NVIDIA Isaac Sim."],
    ros: ["ROS 2 Humble 写在 6D 定位那条视频的简介里，也出现在多条标题中。", "ROS 2 Humble is named in the 6D localization note and in several titles."],
    claw: ["OpenClaw 和 GPT 做语言，中间是 Node.js、ROS 2 和 C++。", "OpenClaw and GPT handle language. The middle is Node.js, ROS 2, and C++."],
    llm: ["OpenClaw 视频写的是 OpenClaw 与 GPT。", "The OpenClaw video names OpenClaw and GPT."]
  };
  var byId = {};
  nodes.forEach(function (node) { byId[node.id] = node; });

  var ns = "http://www.w3.org/2000/svg";
  function el(name, attrs) {
    var node = document.createElementNS(ns, name);
    Object.keys(attrs).forEach(function (key) { node.setAttribute(key, attrs[key]); });
    return node;
  }
  var defs = el("defs", {});
  defs.innerHTML = '<filter id="glow"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>';
  svg.appendChild(defs);
  var edgeLayer = el("g", {});
  var nodeLayer = el("g", {});
  svg.appendChild(edgeLayer);
  svg.appendChild(nodeLayer);

  edges.forEach(function (pair) {
    var a = byId[pair[0]];
    var b = byId[pair[1]];
    edgeLayer.appendChild(el("line", {
      x1: a.x, y1: a.y, x2: b.x, y2: b.y,
      stroke: "rgba(122,239,255,0.45)", "stroke-width": "1.4"
    }));
  });

  var selected = null;
  function paintNote(node) {
    if (!note) return;
    note.textContent = "";
    var text = document.createElement("span");
    text.textContent = tr(node.zh, node.en) + " — " + tr(blurbs[node.id][0], blurbs[node.id][1]) + " ";
    note.appendChild(text);
  }
  function select(node) {
    selected = node.id;
    svg.querySelectorAll(".g-node").forEach(function (item) {
      item.classList.toggle("is-on", item.getAttribute("data-id") === node.id);
    });
    paintNote(node);
    var chip = document.querySelector('[data-filter="' + node.filter + '"]');
    if (chip) chip.click();
  }
  window.highlightGraph = function (filter) {
    var match = nodes.filter(function (node) { return node.filter === filter; })[0];
    if (!match) return;
    selected = match.id;
    svg.querySelectorAll(".g-node").forEach(function (item) {
      item.classList.toggle("is-on", item.getAttribute("data-id") === match.id);
    });
    paintNote(match);
  };

  nodes.forEach(function (node) {
    var group = el("g", { class: "g-node", tabindex: "0", role: "button", "data-id": node.id });
    group.appendChild(el("circle", { cx: node.x, cy: node.y, r: node.id === "ros" || node.id === "pose" ? 28 : 22, class: "g-dot" }));
    var label = el("text", { x: node.x, y: node.y + 38, "text-anchor": "middle", class: "g-label" });
    label.textContent = tr(node.zh, node.en);
    group.appendChild(label);
    group.addEventListener("click", function () { select(node); });
    group.addEventListener("keydown", function (event) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        select(node);
      }
    });
    nodeLayer.appendChild(group);
    node.group = group;
    node.label = label;
  });

  document.addEventListener("site-lang", function () {
    nodes.forEach(function (node) {
      node.label.textContent = tr(node.zh, node.en);
      node.group.setAttribute("aria-label", tr(node.zh, node.en));
    });
    if (!selected && note) {
      note.textContent = tr("点一个节点，筛选下面的视频。", "Click a node to filter the videos below.");
    } else if (selected) {
      paintNote(byId[selected]);
    }
  });
  nodes.forEach(function (node) {
    node.group.setAttribute("aria-label", tr(node.zh, node.en));
  });
})();
