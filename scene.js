(function () {
  "use strict";

  var canvas = document.getElementById("scene");
  var stage = document.getElementById("scene-stage");
  var card = document.getElementById("scene-card");
  var fallback = document.getElementById("scene-fallback");
  if (!canvas || !stage) return;

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var mobile = window.matchMedia("(max-width: 760px)").matches;

  function tr(zh, en) {
    return window.siteLang && siteLang.get() === "en" ? en : zh;
  }

  function showFallback() {
    canvas.hidden = true;
    if (fallback) fallback.hidden = false;
  }

  var gl = canvas.getContext("webgl", { antialias: true, alpha: false, powerPreference: "low-power" });
  if (!gl) {
    showFallback();
    return;
  }
  stage.classList.add("has-webgl");
  if (fallback) fallback.hidden = true;

  function compile(type, src) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }
  var vs = compile(gl.VERTEX_SHADER, [
    "attribute vec3 aPos;",
    "attribute vec3 aNrm;",
    "uniform mat4 uMVP;",
    "uniform mat4 uModel;",
    "varying vec3 vN;",
    "void main(){",
    "  vN = mat3(uModel[0].xyz, uModel[1].xyz, uModel[2].xyz) * aNrm;",
    "  gl_Position = uMVP * vec4(aPos, 1.0);",
    "}"
  ].join("\n"));
  var fs = compile(gl.FRAGMENT_SHADER, [
    "precision mediump float;",
    "varying vec3 vN;",
    "uniform vec3 uColor;",
    "void main(){",
    "  vec3 n = normalize(vN);",
    "  float d = max(dot(n, normalize(vec3(0.35, 0.85, 0.4))), 0.0);",
    "  float rim = pow(1.0 - max(dot(n, vec3(0.0, 0.0, 1.0)), 0.0), 2.0);",
    "  gl_FragColor = vec4(uColor * (0.22 + 0.78 * d) + vec3(0.15, 0.35, 0.45) * rim * 0.35, 1.0);",
    "}"
  ].join("\n"));
  if (!vs || !fs) {
    showFallback();
    return;
  }
  var prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    showFallback();
    return;
  }
  gl.useProgram(prog);
  var locPos = gl.getAttribLocation(prog, "aPos");
  var locNrm = gl.getAttribLocation(prog, "aNrm");
  var locMVP = gl.getUniformLocation(prog, "uMVP");
  var locModel = gl.getUniformLocation(prog, "uModel");
  var locColor = gl.getUniformLocation(prog, "uColor");

  var box = new Float32Array([
    -1,-1,1, 0,0,1,  1,-1,1, 0,0,1,  1,1,1, 0,0,1,  -1,-1,1, 0,0,1,  1,1,1, 0,0,1,  -1,1,1, 0,0,1,
    -1,-1,-1, 0,0,-1,  -1,1,-1, 0,0,-1,  1,1,-1, 0,0,-1,  -1,-1,-1, 0,0,-1,  1,1,-1, 0,0,-1,  1,-1,-1, 0,0,-1,
    -1,1,-1, 0,1,0,  -1,1,1, 0,1,0,  1,1,1, 0,1,0,  -1,1,-1, 0,1,0,  1,1,1, 0,1,0,  1,1,-1, 0,1,0,
    -1,-1,-1, 0,-1,0,  1,-1,-1, 0,-1,0,  1,-1,1, 0,-1,0,  -1,-1,-1, 0,-1,0,  1,-1,1, 0,-1,0,  -1,-1,1, 0,-1,0,
    1,-1,-1, 1,0,0,  1,1,-1, 1,0,0,  1,1,1, 1,0,0,  1,-1,-1, 1,0,0,  1,1,1, 1,0,0,  1,-1,1, 1,0,0,
    -1,-1,-1, -1,0,0,  -1,-1,1, -1,0,0,  -1,1,1, -1,0,0,  -1,-1,-1, -1,0,0,  -1,1,1, -1,0,0,  -1,1,-1, -1,0,0
  ]);
  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, box, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(locPos);
  gl.vertexAttribPointer(locPos, 3, gl.FLOAT, false, 24, 0);
  gl.enableVertexAttribArray(locNrm);
  gl.vertexAttribPointer(locNrm, 3, gl.FLOAT, false, 24, 12);
  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);
  gl.clearColor(0.04, 0.06, 0.1, 1);

  function mul(a, b) {
    var o = new Float32Array(16);
    for (var c = 0; c < 4; c += 1) {
      for (var r = 0; r < 4; r += 1) {
        o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
      }
    }
    return o;
  }
  function id() {
    return new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);
  }
  function translate(x, y, z) {
    var m = id();
    m[12] = x; m[13] = y; m[14] = z;
    return m;
  }
  function scale(x, y, z) {
    var m = id();
    m[0] = x; m[5] = y; m[10] = z;
    return m;
  }
  function rotY(a) {
    var c = Math.cos(a), s = Math.sin(a), m = id();
    m[0] = c; m[2] = -s; m[8] = s; m[10] = c;
    return m;
  }
  function rotZ(a) {
    var c = Math.cos(a), s = Math.sin(a), m = id();
    m[0] = c; m[1] = s; m[4] = -s; m[5] = c;
    return m;
  }
  function perspective(fovy, aspect, near, far) {
    var f = 1 / Math.tan(fovy / 2);
    var m = new Float32Array(16);
    m[0] = f / aspect;
    m[5] = f;
    m[10] = (far + near) / (near - far);
    m[11] = -1;
    m[14] = (2 * far * near) / (near - far);
    return m;
  }
  function lookAt(eye, target) {
    var zx = eye[0] - target[0], zy = eye[1] - target[1], zz = eye[2] - target[2];
    var zl = Math.hypot(zx, zy, zz) || 1;
    zx /= zl; zy /= zl; zz /= zl;
    var xx = zy * 0 - zz * 1, xy = zz * 0 - zx * 0, xz = zx * 1 - zy * 0;
    var xl = Math.hypot(xx, xy, xz) || 1;
    xx /= xl; xy /= xl; xz /= xl;
    var yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
    return new Float32Array([
      xx, yx, zx, 0,
      xy, yy, zy, 0,
      xz, yz, zz, 0,
      -(xx * eye[0] + xy * eye[1] + xz * eye[2]),
      -(yx * eye[0] + yy * eye[1] + yz * eye[2]),
      -(zx * eye[0] + zy * eye[1] + zz * eye[2]),
      1
    ]);
  }
  function invert(m) {
    var a = m, inv = new Float32Array(16);
    inv[0] = a[5]*a[10]*a[15] - a[5]*a[11]*a[14] - a[9]*a[6]*a[15] + a[9]*a[7]*a[14] + a[13]*a[6]*a[11] - a[13]*a[7]*a[10];
    inv[4] = -a[4]*a[10]*a[15] + a[4]*a[11]*a[14] + a[8]*a[6]*a[15] - a[8]*a[7]*a[14] - a[12]*a[6]*a[11] + a[12]*a[7]*a[10];
    inv[8] = a[4]*a[9]*a[15] - a[4]*a[11]*a[13] - a[8]*a[5]*a[15] + a[8]*a[7]*a[13] + a[12]*a[5]*a[11] - a[12]*a[7]*a[9];
    inv[12] = -a[4]*a[9]*a[14] + a[4]*a[10]*a[13] + a[8]*a[5]*a[14] - a[8]*a[6]*a[13] - a[12]*a[5]*a[10] + a[12]*a[6]*a[9];
    inv[1] = -a[1]*a[10]*a[15] + a[1]*a[11]*a[14] + a[9]*a[2]*a[15] - a[9]*a[3]*a[14] - a[13]*a[2]*a[11] + a[13]*a[3]*a[10];
    inv[5] = a[0]*a[10]*a[15] - a[0]*a[11]*a[14] - a[8]*a[2]*a[15] + a[8]*a[3]*a[14] + a[12]*a[2]*a[11] - a[12]*a[3]*a[10];
    inv[9] = -a[0]*a[9]*a[15] + a[0]*a[11]*a[13] + a[8]*a[1]*a[15] - a[8]*a[3]*a[13] - a[12]*a[1]*a[11] + a[12]*a[3]*a[9];
    inv[13] = a[0]*a[9]*a[14] - a[0]*a[10]*a[13] - a[8]*a[1]*a[14] + a[8]*a[2]*a[13] + a[12]*a[1]*a[10] - a[12]*a[2]*a[9];
    inv[2] = a[1]*a[6]*a[15] - a[1]*a[7]*a[14] - a[5]*a[2]*a[15] + a[5]*a[3]*a[14] + a[13]*a[2]*a[7] - a[13]*a[3]*a[6];
    inv[6] = -a[0]*a[6]*a[15] + a[0]*a[7]*a[14] + a[4]*a[2]*a[15] - a[4]*a[3]*a[14] - a[12]*a[2]*a[7] + a[12]*a[3]*a[6];
    inv[10] = a[0]*a[5]*a[15] - a[0]*a[7]*a[13] - a[4]*a[1]*a[15] + a[4]*a[3]*a[13] + a[12]*a[1]*a[7] - a[12]*a[3]*a[5];
    inv[14] = -a[0]*a[5]*a[14] + a[0]*a[6]*a[13] + a[4]*a[1]*a[14] - a[4]*a[2]*a[13] - a[12]*a[1]*a[6] + a[12]*a[2]*a[5];
    inv[3] = -a[1]*a[6]*a[11] + a[1]*a[7]*a[10] + a[5]*a[2]*a[11] - a[5]*a[3]*a[10] - a[9]*a[2]*a[7] + a[9]*a[3]*a[6];
    inv[7] = a[0]*a[6]*a[11] - a[0]*a[7]*a[10] - a[4]*a[2]*a[11] + a[4]*a[3]*a[10] + a[8]*a[2]*a[7] - a[8]*a[3]*a[6];
    inv[11] = -a[0]*a[5]*a[11] + a[0]*a[7]*a[9] + a[4]*a[1]*a[11] - a[4]*a[3]*a[9] - a[8]*a[1]*a[7] + a[8]*a[3]*a[5];
    inv[15] = a[0]*a[5]*a[10] - a[0]*a[6]*a[9] - a[4]*a[1]*a[10] + a[4]*a[2]*a[9] + a[8]*a[1]*a[6] - a[8]*a[2]*a[5];
    var det = a[0]*inv[0] + a[1]*inv[4] + a[2]*inv[8] + a[3]*inv[12];
    if (!det) return id();
    for (var i = 0; i < 16; i += 1) inv[i] /= det;
    return inv;
  }
  function applyPoint(m, p) {
    var x = m[0]*p[0] + m[4]*p[1] + m[8]*p[2] + m[12];
    var y = m[1]*p[0] + m[5]*p[1] + m[9]*p[2] + m[13];
    var z = m[2]*p[0] + m[6]*p[1] + m[10]*p[2] + m[14];
    var w = m[3]*p[0] + m[7]*p[1] + m[11]*p[2] + m[15];
    return [x / w, y / w, z / w];
  }

  function arm(side, color) {
    var s = side;
    return [
      [s * 0.85, -0.35, 0.15, 0.16, 0.28, 0.16, color],
      [s * 0.85, 0.05, 0.15, 0.1, 0.42, 0.1, color],
      [s * 1.15, 0.28, 0.35, 0.34, 0.08, 0.08, color],
      [s * 1.4, 0.12, 0.55, 0.08, 0.22, 0.08, color],
      [s * 1.4, 0.02, 0.68, 0.12, 0.05, 0.16, [0.97, 0.9, 0.65]]
    ];
  }
  var cyan = [0.35, 0.86, 0.95];
  var orange = [1, 0.62, 0.32];
  var parts = [
    {
      id: "dual",
      href: "projects/dual-arm-loading.html",
      zh: "双臂上下料",
      en: "Dual-arm loading",
      blurbZh: "视频标题是双臂机器人工厂上下料。简介是空的，没有写方法或数字。",
      blurbEn: "The video is titled dual-arm factory loading. Its description is empty, with no method and no numbers.",
      boxes: arm(-1, cyan).concat(arm(1, orange)).concat([
        [0, -0.72, 0.2, 1.7, 0.08, 0.7, [0.12, 0.16, 0.24]]
      ])
    },
    {
      id: "pose",
      href: "projects/pose-6d.html",
      zh: "6D 姿态",
      en: "6D pose",
      blurbZh: "深度学习版用 RealSense D415 和 FoundationPose 的 ROS 2 版本。传统版用奥比中光 Gemini 335，特征点匹配加深度法向量。",
      blurbEn: "The deep version uses a RealSense D415 and FoundationPose on ROS 2. The classical version uses an Orbbec Gemini 335: feature matching plus depth normals.",
      boxes: [
        [0, -0.15, -0.85, 0.08, 0.55, 0.08, [0.75, 0.55, 0.95]],
        [0, 0.2, -0.85, 0.22, 0.14, 0.12, [0.95, 0.45, 0.62]],
        [0, 0.2, -0.72, 0.08, 0.08, 0.06, [0.9, 0.95, 1]]
      ]
    },
    {
      id: "isaac",
      href: "projects/isaac-nav2.html",
      zh: "Isaac Sim + Nav2",
      en: "Isaac Sim + Nav2",
      blurbZh: "简介只有一句：在英伟达的 Isaac Sim 里部署 Nav2 导航算法。",
      blurbEn: "The description is one sentence: Nav2 is deployed inside NVIDIA Isaac Sim.",
      boxes: [
        [0, 0.15, -1.35, 0.9, 0.52, 0.05, [0.25, 0.85, 0.55]],
        [0, -0.18, -1.35, 0.1, 0.28, 0.08, [0.2, 0.45, 0.4]]
      ]
    }
  ];
  var floor = [0, -0.9, 0, 3.4, 0.08, 2.3, [0.08, 0.1, 0.16]];

  var pick = [];
  function modelOf(box) {
    return mul(translate(box[0], box[1], box[2]), scale(box[3], box[4], box[5]));
  }
  function remember(part, box) {
    var m = modelOf(box);
    var min = [Infinity, Infinity, Infinity];
    var max = [-Infinity, -Infinity, -Infinity];
    [[-1,-1,-1],[1,-1,-1],[-1,1,-1],[1,1,-1],[-1,-1,1],[1,-1,1],[-1,1,1],[1,1,1]].forEach(function (c) {
      var p = applyPoint(m, c.concat([1]));
      for (var i = 0; i < 3; i += 1) {
        min[i] = Math.min(min[i], p[i]);
        max[i] = Math.max(max[i], p[i]);
      }
    });
    pick.push({ part: part, min: min, max: max });
  }
  parts.forEach(function (part) {
    part.boxes.forEach(function (box) { remember(part, box); });
  });

  var theta = 0.7;
  var phi = 1.05;
  var radius = 5.4;
  var dragging = false;
  var moved = 0;
  var lastX = 0;
  var lastY = 0;
  var visible = false;
  var raf = 0;
  var running = true;

  function resize() {
    var rect = canvas.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1 : 1.5);
    var w = Math.max(2, Math.floor(rect.width * dpr));
    var h = Math.max(2, Math.floor(rect.height * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    gl.viewport(0, 0, canvas.width, canvas.height);
  }

  function draw() {
    resize();
    var aspect = canvas.width / canvas.height;
    var eye = [
      radius * Math.sin(phi) * Math.sin(theta),
      radius * Math.cos(phi) + 0.2,
      radius * Math.sin(phi) * Math.cos(theta)
    ];
    var view = lookAt(eye, [0, -0.05, 0]);
    var proj = perspective(0.9, aspect, 0.1, 40);
    var vp = mul(proj, view);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    function paint(box) {
      var model = modelOf(box);
      gl.uniformMatrix4fv(locModel, false, model);
      gl.uniformMatrix4fv(locMVP, false, mul(vp, model));
      gl.uniform3fv(locColor, box[6]);
      gl.drawArrays(gl.TRIANGLES, 0, 36);
    }
    paint(floor);
    parts.forEach(function (part) { part.boxes.forEach(paint); });
  }

  function loop() {
    raf = 0;
    if (!running || !visible) return;
    if (!dragging && !reduce) theta += 0.004;
    draw();
    if (!reduce) raf = window.requestAnimationFrame(loop);
  }
  function start() {
    if (raf || !running || !visible) return;
    if (reduce) draw();
    else raf = window.requestAnimationFrame(loop);
  }
  function stop() {
    if (raf) window.cancelAnimationFrame(raf);
    raf = 0;
  }

  function hit(event) {
    var rect = canvas.getBoundingClientRect();
    var x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    var y = 1 - ((event.clientY - rect.top) / rect.height) * 2;
    var eye = [
      radius * Math.sin(phi) * Math.sin(theta),
      radius * Math.cos(phi) + 0.2,
      radius * Math.sin(phi) * Math.cos(theta)
    ];
    var view = lookAt(eye, [0, -0.05, 0]);
    var proj = perspective(0.9, canvas.width / canvas.height, 0.1, 40);
    var inv = invert(mul(proj, view));
    var near = applyPoint(inv, [x, y, -1, 1]);
    var far = applyPoint(inv, [x, y, 1, 1]);
    var dir = [far[0] - near[0], far[1] - near[1], far[2] - near[2]];
    var best = null;
    var bestT = Infinity;
    pick.forEach(function (item) {
      var tmin = -Infinity;
      var tmax = Infinity;
      for (var i = 0; i < 3; i += 1) {
        if (Math.abs(dir[i]) < 1e-8) {
          if (near[i] < item.min[i] || near[i] > item.max[i]) return;
        } else {
          var t1 = (item.min[i] - near[i]) / dir[i];
          var t2 = (item.max[i] - near[i]) / dir[i];
          if (t1 > t2) { var tmp = t1; t1 = t2; t2 = tmp; }
          tmin = Math.max(tmin, t1);
          tmax = Math.min(tmax, t2);
          if (tmax < tmin) return;
        }
      }
      var t = tmin > 0 ? tmin : tmax;
      if (t > 0 && t < bestT) { bestT = t; best = item.part; }
    });
    return best;
  }

  function showPart(part) {
    if (!card || !part) return;
    card.textContent = "";
    var strong = document.createElement("strong");
    strong.textContent = tr(part.zh, part.en);
    var text = document.createElement("span");
    text.textContent = " " + tr(part.blurbZh, part.blurbEn) + " ";
    var link = document.createElement("a");
    link.href = part.href;
    link.textContent = tr("打开项目笔记", "Open the project note");
    card.appendChild(strong);
    card.appendChild(text);
    card.appendChild(link);
  }

  canvas.addEventListener("pointerdown", function (event) {
    dragging = true;
    moved = 0;
    lastX = event.clientX;
    lastY = event.clientY;
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener("pointermove", function (event) {
    if (!dragging) return;
    var dx = event.clientX - lastX;
    var dy = event.clientY - lastY;
    moved += Math.abs(dx) + Math.abs(dy);
    lastX = event.clientX;
    lastY = event.clientY;
    theta -= dx * 0.01;
    phi = Math.max(0.35, Math.min(1.45, phi - dy * 0.008));
    if (reduce) draw();
  });
  function endDrag(event) {
    if (!dragging) return;
    dragging = false;
    if (moved < 6) showPart(hit(event));
  }
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", function () { dragging = false; });

  document.addEventListener("visibilitychange", function () {
    running = !document.hidden;
    if (running) start();
    else stop();
  });
  document.addEventListener("site-lang", function () {
    if (card && !card.querySelector("a")) {
      card.textContent = tr("拖动环视。点机械臂、相机，或绿色的仿真板。", "Drag to look around. Click an arm, the camera, or the green panel.");
    }
  });
  if ("IntersectionObserver" in window) {
    var observer = new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible) start();
      else stop();
    }, { threshold: 0.05 });
    observer.observe(stage);
  } else {
    visible = true;
    start();
  }
  window.addEventListener("resize", function () { if (reduce) draw(); });
})();
