import * as THREE from "./assets/vendor/three/three.module.js";
import { OrbitControls } from "./assets/vendor/three/OrbitControls.js";

const host = document.getElementById("skill-graph");
const canvas = document.getElementById("graph-canvas");
const note = document.getElementById("graph-note");
const fallback = document.getElementById("graph-fallback");
if (canvas && host) {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mobile = window.matchMedia("(max-width: 760px)").matches;

  function tr(zh, en) {
    return window.siteLang && siteLang.get() === "en" ? en : zh;
  }

  const CAT = {
    vision: 0x5ce1ff,
    pose: 0xff6b9a,
    manip: 0xffb15a,
    nav: 0x3ee0a0,
    tools: 0xb79bff
  };

  const spec = [
    { id: "pose", zh: "6D 姿态", en: "6D pose", cat: "pose", filter: "pose" },
    { id: "fp", zh: "FoundationPose", en: "FoundationPose", cat: "pose", filter: "foundationpose" },
    { id: "rs", zh: "RealSense", en: "RealSense", cat: "vision", filter: "realsense" },
    { id: "ob", zh: "Orbbec", en: "Orbbec", cat: "vision", filter: "orbbec" },
    { id: "moveit", zh: "MoveIt 2", en: "MoveIt 2", cat: "manip", filter: "moveit" },
    { id: "dual", zh: "双臂", en: "Dual-arm", cat: "manip", filter: "dual" },
    { id: "mobile", zh: "移动操作", en: "Mobile manip.", cat: "manip", filter: "mobile" },
    { id: "nav", zh: "Nav2", en: "Nav2", cat: "nav", filter: "nav2" },
    { id: "isaac", zh: "Isaac Sim", en: "Isaac Sim", cat: "nav", filter: "isaac" },
    { id: "ros", zh: "ROS 2", en: "ROS 2", cat: "tools", filter: "ros2" },
    { id: "claw", zh: "OpenClaw", en: "OpenClaw", cat: "tools", filter: "openclaw" },
    { id: "llm", zh: "GPT", en: "GPT", cat: "tools", filter: "llm" }
  ];
  const links = [
    ["rs", "pose"], ["ob", "pose"], ["fp", "pose"],
    ["pose", "moveit"], ["moveit", "dual"], ["moveit", "mobile"],
    ["mobile", "nav"], ["nav", "isaac"],
    ["ros", "pose"], ["ros", "moveit"], ["ros", "nav"], ["ros", "isaac"], ["ros", "claw"],
    ["claw", "llm"], ["claw", "moveit"]
  ];
  const blurbs = {
    pose: ["同一天两条视频：FoundationPose，以及特征点匹配加深度法向量。", "Two videos the same day: FoundationPose, and feature matching plus depth normals."],
    fp: ["深度学习版使用 FoundationPose 的 ROS 2 版本。", "The deep-learning video uses the ROS 2 build of FoundationPose."],
    rs: ["深度学习版的相机是 RealSense D415。", "The deep-learning video uses a RealSense D415."],
    ob: ["传统版的相机是奥比中光 Gemini 335。", "The classical video uses an Orbbec Gemini 335."],
    moveit: ["MoveIt 2 出现在 OpenClaw 视频和 6D 定位规划视频里。", "MoveIt 2 is in the OpenClaw video and the 6D localization video."],
    dual: ["双臂上下料。那条视频没有文字简介。", "Dual-arm loading. That video has no written description."],
    mobile: ["移动抓取的简介是机械臂视觉规控，加上小车自主导航。", "The mobile video says arm visual planning plus base navigation."],
    nav: ["Nav2 出现在 Isaac Sim 视频和导航教程里。", "Nav2 is in the Isaac Sim video and the navigation tutorial."],
    isaac: ["简介：在英伟达的 Isaac Sim 里部署 Nav2。", "The note says Nav2 is deployed inside NVIDIA Isaac Sim."],
    ros: ["ROS 2 Humble 写在 6D 定位那条视频里，也出现在多条标题中。", "ROS 2 Humble is named in the 6D localization note and in several titles."],
    claw: ["OpenClaw 和 GPT 做语言，中间是 Node.js、ROS 2 和 C++。", "OpenClaw and GPT handle language. The middle is Node.js, ROS 2, and C++."],
    llm: ["OpenClaw 视频写的是 OpenClaw 与 GPT。", "The OpenClaw video names OpenClaw and GPT."]
  };

  const seeds = {
    rs: [-2.2, 0.4, 0.8], ob: [-2.1, -0.7, -0.4], fp: [-1.2, 1.4, -0.5], pose: [-0.8, 0.2, 0.1],
    moveit: [0.3, 0.5, 0.2], dual: [1.3, 1.2, 0.5], mobile: [1.2, -0.1, -0.4],
    nav: [2.2, -0.5, 0.3], isaac: [3.0, -0.2, -0.5],
    ros: [0.2, -0.9, 1.1], claw: [0.6, 1.7, -0.9], llm: [1.5, 2.0, -1.1]
  };

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: !mobile, alpha: false, powerPreference: "high-performance" });
  } catch (err) {
    renderer = null;
  }
  if (!renderer) {
    canvas.hidden = true;
    if (fallback) fallback.hidden = false;
  } else {
    host.classList.add("has-webgl");
    if (fallback) fallback.hidden = true;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1 : 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070b14);
    scene.fog = new THREE.FogExp2(0x070b14, 0.085);
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 80);
    camera.position.set(0.4, 2.2, 8);
    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.autoRotate = !reduce;
    controls.autoRotateSpeed = 0.4;
    controls.enablePan = false;
    controls.minDistance = 4;
    controls.maxDistance = 18;
    controls.target.set(0.2, 0.4, 0);

    scene.add(new THREE.AmbientLight(0x99c7dd, 0.55));
    const p1 = new THREE.PointLight(0x39e7ff, 10, 12, 2);
    p1.position.set(-2, 2, 3);
    scene.add(p1);
    const p2 = new THREE.PointLight(0xff5d92, 6, 10, 2);
    p2.position.set(2, -1, 2);
    scene.add(p2);

    const byId = {};
    spec.forEach(function (item) {
      const color = CAT[item.cat];
      const pos = new THREE.Vector3().fromArray(seeds[item.id]);
      const group = new THREE.Group();
      group.position.copy(pos);
      const radius = item.id === "ros" || item.id === "pose" ? 0.4 : 0.3;
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(radius, mobile ? 16 : 28, mobile ? 12 : 20),
        new THREE.MeshStandardMaterial({
          color,
          emissive: color,
          emissiveIntensity: 0.85,
          metalness: 0.45,
          roughness: 0.28
        })
      );
      sphere.userData.id = item.id;
      const glow = new THREE.Mesh(
        new THREE.SphereGeometry(radius * 1.7, 16, 12),
        new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.18,
          depthWrite: false,
          blending: THREE.AdditiveBlending
        })
      );
      group.add(sphere, glow);
      scene.add(group);
      byId[item.id] = Object.assign({ pos: pos, group: group, sphere: sphere, glow: glow, radius: radius }, item);
    });

    const ids = Object.keys(byId);
    for (let step = 0; step < 80; step += 1) {
      ids.forEach(function (a) {
        ids.forEach(function (b) {
          if (a >= b) return;
          const d = byId[a].pos.clone().sub(byId[b].pos);
          const dist = Math.max(0.45, d.length());
          if (dist < 1.6) {
            const push = d.normalize().multiplyScalar(0.03 * (1.6 - dist));
            byId[a].pos.add(push);
            byId[b].pos.sub(push);
          }
        });
      });
      links.forEach(function (pair) {
        const a = byId[pair[0]].pos;
        const b = byId[pair[1]].pos;
        const delta = b.clone().sub(a);
        const dist = delta.length();
        const pull = delta.multiplyScalar(0.008 * (dist - 1.8));
        a.add(pull);
        b.sub(pull);
      });
    }
    ids.forEach(function (id) { byId[id].group.position.copy(byId[id].pos); });
    const fitBox = new THREE.Box3();
    ids.forEach(function (id) { fitBox.expandByPoint(byId[id].pos); });
    fitBox.expandByScalar(0.85);
    const fitCenter = fitBox.getCenter(new THREE.Vector3());
    const fitSize = fitBox.getSize(new THREE.Vector3());
    const fitDist = Math.max(fitSize.x, fitSize.y, fitSize.z) * 1.15 + 1.8;
    camera.position.set(fitCenter.x + fitDist * 0.12, fitCenter.y + fitDist * 0.32, fitCenter.z + fitDist);
    controls.target.copy(fitCenter);

    const adj = {};
    ids.forEach(function (id) { adj[id] = []; });
    links.forEach(function (pair) {
      adj[pair[0]].push(pair[1]);
      adj[pair[1]].push(pair[0]);
    });

    function makeLabel(text, color) {
      const board = document.createElement("canvas");
      board.width = 640;
      board.height = 128;
      const ctx = board.getContext("2d");
      ctx.clearRect(0, 0, 640, 128);
      ctx.font = "700 54px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineWidth = 10;
      ctx.strokeStyle = "rgba(4, 8, 16, 0.92)";
      ctx.strokeText(text, 320, 66);
      ctx.fillStyle = "#f5fbff";
      ctx.fillText(text, 320, 66);
      const tex = new THREE.CanvasTexture(board);
      tex.colorSpace = THREE.SRGBColorSpace;
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
      sprite.scale.set(mobile ? 2.8 : 2.35, mobile ? 0.56 : 0.47, 1);
      sprite.position.y = 0.72;
      return sprite;
    }
    function hexCss(hex) {
      return "#" + hex.toString(16).padStart(6, "0");
    }
    ids.forEach(function (id) {
      const node = byId[id];
      node.label = makeLabel(tr(node.zh, node.en), hexCss(CAT[node.cat]));
      node.group.add(node.label);
    });

    const linePos = new Float32Array(links.length * 2 * 3);
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute("position", new THREE.BufferAttribute(linePos, 3));
    const lines = new THREE.LineSegments(
      lineGeo,
      new THREE.LineBasicMaterial({ color: 0x7ee9ff, transparent: true, opacity: 0.45 })
    );
    scene.add(lines);
    function writeLines() {
      links.forEach(function (pair, i) {
        const a = byId[pair[0]].group.position;
        const b = byId[pair[1]].group.position;
        linePos.set([a.x, a.y, a.z, b.x, b.y, b.z], i * 6);
      });
      lineGeo.attributes.position.needsUpdate = true;
    }
    writeLines();

    const flowCount = links.length * (mobile ? 1 : 3);
    const flowPos = new Float32Array(flowCount * 3);
    const flowGeo = new THREE.BufferGeometry();
    flowGeo.setAttribute("position", new THREE.BufferAttribute(flowPos, 3));
    const flow = new THREE.Points(
      flowGeo,
      new THREE.PointsMaterial({ color: 0xfff2c4, size: 0.055, transparent: true, opacity: 0.9, depthWrite: false })
    );
    scene.add(flow);

    const cameraHome = camera.position.clone();
    const targetHome = controls.target.clone();
    let focusNode = null;
    let selected = null;

    function paintNote(node) {
      if (!note || !node) return;
      note.textContent = tr(node.zh, node.en) + " — " + tr(blurbs[node.id][0], blurbs[node.id][1]);
    }
    function applyHighlight(id) {
      const neighbors = id ? adj[id].concat([id]) : null;
      ids.forEach(function (key) {
        const on = !neighbors || neighbors.indexOf(key) !== -1;
        byId[key].sphere.material.emissiveIntensity = on ? 1.15 : 0.15;
        byId[key].glow.material.opacity = on ? 0.28 : 0.04;
        byId[key].label.material.opacity = on ? 1 : 0.25;
      });
    }
    function choose(node, filterVideos) {
      selected = node.id;
      focusNode = node;
      applyHighlight(node.id);
      paintNote(node);
      controls.autoRotate = false;
      if (filterVideos) {
        const chip = document.querySelector('[data-filter="' + node.filter + '"]');
        if (chip) chip.click();
      }
    }
    window.highlightGraph = function (filter) {
      const node = spec.map(function (item) { return byId[item.id]; }).filter(function (node) {
        return node.filter === filter;
      })[0];
      if (node) choose(node, false);
    };

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const spheres = ids.map(function (id) { return byId[id].sphere; });
    let pressX = 0;
    let pressY = 0;
    canvas.addEventListener("pointerdown", function (event) {
      pressX = event.clientX;
      pressY = event.clientY;
      controls.autoRotate = false;
    });
    canvas.addEventListener("pointermove", function (event) {
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(spheres, false);
      canvas.style.cursor = hits.length ? "pointer" : "grab";
      if (!selected) applyHighlight(hits.length ? hits[0].object.userData && hits[0].object.userData.id || null : null);
      if (hits.length && !selected) {
        const id = hits[0].object.userData.id;
        applyHighlight(id);
      }
    });
    canvas.addEventListener("pointerup", function (event) {
      const dragged = Math.abs(event.clientX - pressX) + Math.abs(event.clientY - pressY) > 6;
      if (!dragged) {
        const rect = canvas.getBoundingClientRect();
        pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(pointer, camera);
        const hits = raycaster.intersectObjects(spheres, false);
        if (hits.length) choose(byId[hits[0].object.userData.id], true);
      }
      if (!reduce && !selected) controls.autoRotate = true;
    });
    ids.forEach(function (id) { byId[id].sphere.userData.id = id; });

    document.addEventListener("site-lang", function () {
      ids.forEach(function (id) {
        const node = byId[id];
        const next = makeLabel(tr(node.zh, node.en), hexCss(CAT[node.cat]));
        node.group.remove(node.label);
        node.label.material.map.dispose();
        node.label.material.dispose();
        node.label = next;
        node.group.add(next);
      });
      if (selected) paintNote(byId[selected]);
    });

    let visible = false;
    let raf = 0;
    let running = !document.hidden;
    const clock = new THREE.Clock();
    const phases = links.map(function (_, i) { return i / links.length; });

    function resize() {
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(2, rect.width);
      const h = Math.max(2, rect.height);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    }
    function frame() {
      raf = 0;
      if (!running || !visible) return;
      const t = clock.getElapsedTime();
      if (focusNode) {
        const destT = focusNode.group.position.clone();
        const destC = destT.clone().add(new THREE.Vector3(1.4, 0.7, 2.4));
        controls.target.lerp(destT, 0.08);
        camera.position.lerp(destC, 0.08);
      } else if (!reduce) {
        controls.target.lerp(targetHome, 0.04);
      }
      if (!reduce) {
        ids.forEach(function (id, index) {
          const node = byId[id];
          node.group.position.y = node.pos.y + Math.sin(t * 0.7 + index) * 0.04;
        });
        writeFlow(t);
      }
      writeLines();
      controls.update();
      renderer.render(scene, camera);
      raf = window.requestAnimationFrame(frame);
    }
    function writeFlow(t) {
      const per = mobile ? 1 : 3;
      let n = 0;
      links.forEach(function (pair, i) {
        const a = byId[pair[0]].group.position;
        const b = byId[pair[1]].group.position;
        for (let k = 0; k < per; k += 1) {
          const u = (t * 0.18 + phases[i] + k / per) % 1;
          flowPos[n++] = a.x + (b.x - a.x) * u;
          flowPos[n++] = a.y + (b.y - a.y) * u;
          flowPos[n++] = a.z + (b.z - a.z) * u;
        }
      });
      flowGeo.attributes.position.needsUpdate = true;
    }
    function start() {
      if (!raf && running && visible) raf = window.requestAnimationFrame(frame);
    }
    function stop() {
      if (raf) window.cancelAnimationFrame(raf);
      raf = 0;
    }
    document.addEventListener("visibilitychange", function () {
      running = !document.hidden;
      if (running) start();
      else stop();
    });
    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) start();
        else stop();
      }, { threshold: 0.08 });
      observer.observe(host);
    } else {
      visible = true;
      start();
    }
    window.addEventListener("resize", resize);
    resize();
    if (reduce) {
      controls.autoRotate = false;
      renderer.render(scene, camera);
    }
  }
}
