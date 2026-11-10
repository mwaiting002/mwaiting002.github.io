import * as THREE from "./assets/vendor/three/three.module.js";
import { OrbitControls } from "./assets/vendor/three/OrbitControls.js";

const canvas = document.getElementById("scene");
const stage = document.getElementById("scene-stage");
const card = document.getElementById("scene-card");
const fallback = document.getElementById("scene-fallback");
if (!canvas || !stage) {
  /* project pages do not include the lab */
} else {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mobile = window.matchMedia("(max-width: 760px)").matches;

  function tr(zh, en) {
    return window.siteLang && siteLang.get() === "en" ? en : zh;
  }

  function showFallback() {
    canvas.hidden = true;
    if (fallback) fallback.hidden = false;
  }

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !mobile,
      alpha: false,
      powerPreference: "high-performance"
    });
  } catch (err) {
    renderer = null;
  }
  if (!renderer) showFallback();
  else {
    stage.classList.add("has-webgl");
    if (fallback) fallback.hidden = true;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1 : 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x05070e);
    scene.fog = new THREE.FogExp2(0x05070e, 0.075);

    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 40);
    camera.position.set(2.15, 1.35, 2.35);

    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.autoRotate = !reduce;
    controls.autoRotateSpeed = 0.65;
    controls.enablePan = false;
    controls.minDistance = 1.6;
    controls.maxDistance = 5.2;
    controls.minPolarAngle = 0.45;
    controls.maxPolarAngle = Math.PI * 0.48;
    controls.target.set(0, 0.72, 0.05);

    scene.add(new THREE.AmbientLight(0x8fb4c8, 0.35));
    scene.add(new THREE.HemisphereLight(0x9ad7ff, 0x070910, 0.45));
    const key = new THREE.DirectionalLight(0xf4f7ff, 1.35);
    key.position.set(4, 7, 3);
    scene.add(key);
    const cyan = new THREE.PointLight(0x39e7ff, 28, 8, 2);
    cyan.position.set(-1.8, 1.8, 1.2);
    scene.add(cyan);
    const magenta = new THREE.PointLight(0xff4d88, 20, 7, 2);
    magenta.position.set(1.8, 1.4, -1.1);
    scene.add(magenta);

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(7, 64),
      new THREE.MeshStandardMaterial({ color: 0x0b101a, metalness: 0.85, roughness: 0.42 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.02;
    scene.add(floor);
    const grid = new THREE.GridHelper(10, 28, 0x2ee7ff, 0x14344a);
    grid.position.y = 0;
    grid.material.transparent = true;
    grid.material.opacity = 0.85;
    scene.add(grid);
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(1.55, 1.62, 64),
      new THREE.MeshBasicMaterial({ color: 0x39e7ff, transparent: true, opacity: 0.55, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.01;
    scene.add(ring);

    function metal(color, emissive, intensity) {
      return new THREE.MeshStandardMaterial({
        color,
        metalness: 0.86,
        roughness: 0.24,
        emissive,
        emissiveIntensity: intensity
      });
    }
    const shellMat = metal(0xb7d7e4, 0x08303a, 0.55);
    const jointMat = metal(0xd7fbff, 0x39e7ff, 2.1);
    const fingerMat = metal(0xffd7a8, 0xff8a3d, 0.7);
    const tableMat = metal(0x1a2436, 0x0a2030, 0.25);

    function tag(object, part) {
      object.traverse(function (child) {
        if (child.isMesh) child.userData.part = part;
      });
    }

    function arm(x, mirror) {
      const root = new THREE.Group();
      root.position.set(x, 0, 0);
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.18, 0.14, 28), jointMat);
      base.position.y = 0.07;
      root.add(base);
      const shoulder = new THREE.Group();
      shoulder.position.y = 0.16;
      root.add(shoulder);
      const seg = mobile ? 12 : 24;
      const upperLen = 0.58;
      const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, upperLen, seg), shellMat);
      upper.position.y = upperLen / 2;
      shoulder.add(upper);
      const elbowBall = new THREE.Mesh(new THREE.SphereGeometry(0.075, 20, 16), jointMat);
      elbowBall.position.y = upperLen;
      shoulder.add(elbowBall);
      const elbow = new THREE.Group();
      elbow.position.y = upperLen;
      shoulder.add(elbow);
      const foreLen = 0.48;
      const fore = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.068, foreLen, seg), shellMat);
      fore.position.y = foreLen / 2;
      elbow.add(fore);
      const wrist = new THREE.Group();
      wrist.position.y = foreLen;
      elbow.add(wrist);
      wrist.add(new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 12), jointMat));
      const palm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.035, 0.05), shellMat);
      palm.position.y = 0.04;
      wrist.add(palm);
      [-1, 1].forEach(function (side) {
        const finger = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.11, 0.02), fingerMat);
        finger.position.set(side * 0.045, 0.1, 0);
        wrist.add(finger);
      });
      shoulder.rotation.z = mirror * 0.55;
      shoulder.rotation.x = 0.45;
      elbow.rotation.x = -1.15;
      tag(root, "dual");
      return { root: root, shoulder: shoulder, elbow: elbow };
    }

    const left = arm(-0.72, 1);
    const right = arm(0.72, -1);
    left.root.scale.setScalar(1.28);
    right.root.scale.setScalar(1.28);
    scene.add(left.root, right.root);

    const table = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.08, 1.35), tableMat);
    table.position.set(0, -0.02, 0.15);
    scene.add(table);

    const sample = new THREE.Group();
    sample.position.set(0, 0.16, 0.28);
    const gem = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.12, 0),
      metal(0xff8ab3, 0xff4d88, 0.9)
    );
    sample.add(gem);
    const axes = new THREE.AxesHelper(0.62);
    axes.position.y = 0.22;
    sample.add(axes);
    tag(sample, "pose");
    scene.add(sample);

    const scanner = new THREE.Group();
    scanner.position.set(0, 0.95, -0.72);
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 0.16), metal(0xd7c7ff, 0x8a6cff, 0.7));
    scanner.add(body);
    const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.06, 16), jointMat);
    lens.rotation.x = Math.PI / 2;
    lens.position.z = 0.1;
    scanner.add(lens);
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(0.32, 0.95, 28, 1, true),
      new THREE.MeshBasicMaterial({
        color: 0x7af0ff,
        transparent: true,
        opacity: 0.42,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      })
    );
    cone.rotation.x = Math.PI / 2;
    cone.position.z = 0.62;
    cone.scale.set(1.15, 1.25, 1);
    scanner.add(cone);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.9, 12), shellMat);
    pole.position.y = -0.45;
    scanner.add(pole);
    tag(scanner, "pose");
    scene.add(scanner);

    const panel = new THREE.Group();
    panel.position.set(1.55, 0.55, -0.35);
    panel.rotation.y = -0.6;
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.7, 0.42),
      new THREE.MeshStandardMaterial({
        color: 0x123528,
        emissive: 0x1ee08a,
        emissiveIntensity: 0.85,
        metalness: 0.4,
        roughness: 0.35,
        side: THREE.DoubleSide
      })
    );
    panel.add(screen);
    const bezel = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.48, 0.04), metal(0x1b2433, 0x063028, 0.3));
    bezel.position.z = -0.03;
    panel.add(bezel);
    tag(panel, "isaac");
    scene.add(panel);

    const pCount = mobile ? 70 : 160;
    const pPos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i += 1) {
      pPos[i * 3] = (Math.random() - 0.5) * 6;
      pPos[i * 3 + 1] = Math.random() * 2.4;
      pPos[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
    const sparks = new THREE.Points(
      pGeo,
      new THREE.PointsMaterial({ color: 0x9af6ff, size: 0.035, transparent: true, opacity: 0.75, depthWrite: false })
    );
    scene.add(sparks);

    const copy = {
      dual: {
        zh: "双臂上下料",
        en: "Dual-arm loading",
        blurbZh: "视频标题是双臂机器人工厂上下料。简介是空的，没有写方法或数字。",
        blurbEn: "The video is titled dual-arm factory loading. Its description is empty: no method and no numbers.",
        href: "projects/dual-arm-loading.html"
      },
      pose: {
        zh: "6D 姿态",
        en: "6D pose",
        blurbZh: "深度学习版用 RealSense D415 和 FoundationPose 的 ROS 2 版本。传统版用奥比中光 Gemini 335，特征点匹配加深度法向量。",
        blurbEn: "The deep version uses a RealSense D415 and FoundationPose on ROS 2. The classical version uses an Orbbec Gemini 335: feature matching plus depth normals.",
        href: "projects/pose-6d.html"
      },
      isaac: {
        zh: "Isaac Sim + Nav2",
        en: "Isaac Sim + Nav2",
        blurbZh: "简介只有一句：在英伟达的 Isaac Sim 里部署 Nav2 导航算法。",
        blurbEn: "The description is one sentence: Nav2 is deployed inside NVIDIA Isaac Sim.",
        href: "projects/isaac-nav2.html"
      }
    };

    function paintCard(part) {
      if (!card) return;
      const info = copy[part];
      if (!info) return;
      card.textContent = "";
      const strong = document.createElement("strong");
      strong.textContent = tr(info.zh, info.en);
      const text = document.createTextNode(" " + tr(info.blurbZh, info.blurbEn) + " ");
      const link = document.createElement("a");
      link.href = info.href;
      link.textContent = tr("打开项目笔记", "Open the project note");
      card.appendChild(strong);
      card.appendChild(text);
      card.appendChild(link);
    }

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let hovered = null;
    const baseEmissive = new Map();
    scene.traverse(function (obj) {
      if (obj.isMesh && obj.material && obj.material.emissive) {
        baseEmissive.set(obj.material, obj.material.emissiveIntensity);
      }
    });

    function setHover(part) {
      if (hovered === part) return;
      hovered = part;
      canvas.style.cursor = part ? "pointer" : "grab";
      scene.traverse(function (obj) {
        if (!obj.isMesh || !obj.material || !obj.material.emissive) return;
        const mine = obj.userData.part;
        const base = baseEmissive.get(obj.material) || 0.4;
        obj.material.emissiveIntensity = part && mine === part ? base + 0.9 : base;
      });
    }

    function pick(event) {
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(scene.children, true);
      for (let i = 0; i < hits.length; i += 1) {
        let obj = hits[i].object;
        while (obj) {
          if (obj.userData && obj.userData.part) return obj.userData.part;
          obj = obj.parent;
        }
      }
      return null;
    }

    let pressX = 0;
    let pressY = 0;
    canvas.addEventListener("pointerdown", function (event) {
      pressX = event.clientX;
      pressY = event.clientY;
      controls.autoRotate = false;
    });
    canvas.addEventListener("pointermove", function (event) {
      setHover(pick(event));
    });
    canvas.addEventListener("pointerup", function (event) {
      const dragged = Math.abs(event.clientX - pressX) + Math.abs(event.clientY - pressY) > 6;
      if (!dragged) {
        const part = pick(event);
        if (part) paintCard(part);
      }
      if (!reduce) controls.autoRotate = true;
    });
    canvas.addEventListener("pointerleave", function () { setHover(null); });

    const clock = new THREE.Clock();
    let visible = false;
    let raf = 0;
    let running = !document.hidden;

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
      if (!reduce) {
        left.shoulder.rotation.x = 0.4 + Math.sin(t * 0.7) * 0.18;
        left.elbow.rotation.x = -1.1 + Math.sin(t * 0.7 + 0.8) * 0.22;
        right.shoulder.rotation.x = 0.4 + Math.sin(t * 0.7 + Math.PI) * 0.18;
        right.elbow.rotation.x = -1.1 + Math.sin(t * 0.7 + Math.PI + 0.8) * 0.22;
        scanner.rotation.y = Math.sin(t * 0.55) * 0.45;
        sample.position.y = 0.16 + Math.sin(t * 1.2) * 0.03;
        const arr = sparks.geometry.attributes.position.array;
        for (let i = 1; i < arr.length; i += 3) {
          arr[i] += 0.004;
          if (arr[i] > 2.6) arr[i] = 0;
        }
        sparks.geometry.attributes.position.needsUpdate = true;
      }
      controls.update();
      renderer.render(scene, camera);
      raf = window.requestAnimationFrame(frame);
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
      observer.observe(stage);
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

    document.addEventListener("site-lang", function () {
      if (card && !card.querySelector("a")) {
        card.textContent = tr(
          "拖动环视。点机械臂、相机，或绿色的仿真板。",
          "Drag to look around. Click an arm, the camera, or the green panel."
        );
      }
    });
  }
}
