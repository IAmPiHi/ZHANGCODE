const heroText = "ZHANGCODE";
const target = document.getElementById("animated-text");
const root = document.documentElement;

if (target) {
  target.innerHTML = "";

  [...heroText].forEach((char, index) => {
    const wrapper = document.createElement("span");
    wrapper.className = "letter-wrapper";
    wrapper.style.animationDelay = `${index * 0.15}s`;

    const outline = document.createElement("span");
    outline.className = "letter-outline";
    outline.textContent = char;

    const fill = document.createElement("span");
    fill.className = "letter-fill";
    fill.textContent = char;

    wrapper.append(outline, fill);
    target.appendChild(wrapper);
  });
}

initCursorEffects();
initScrollProgress();
initHeroCanvas();
initHeroSweep();

function initHeroSweep() {
  const textEl = document.getElementById("animated-text");
  if (!textEl) return;

  // 等 letterIn 動畫跑完（9 個字 × 0.15s + 0.72s ≈ 2.1s）再開始
  setTimeout(startLightLoop, 2200);

  function startLightLoop() {
    const fills = Array.from(textEl.querySelectorAll(".letter-fill"));
    const count = fills.length;          // ZHANGCODE = 9 個字

    const LIGHT_DURATION = 6000;         // 逐字全亮花 6 秒
    const HOLD_DURATION  = 6000;         // 全亮後停留 6 秒
    const DIM_DURATION   = 5000;         // 全體漸暗花 5 秒
    const PAUSE_DURATION = 600;          // 一輪結束後的短暫停頓

    const lightInterval = LIGHT_DURATION / count;   // 每個字亮起的間隔

    function runCycle() {
      // ── Phase 1：從左到右逐字點亮 ──
      fills.forEach((fill, i) => {
        setTimeout(() => fill.classList.add("letter-lit"), i * lightInterval);
      });

      // ── Phase 2：全亮後等 1.5 秒，全體同時漸弱 5 秒 ──
      const dimStart = LIGHT_DURATION + HOLD_DURATION;
      setTimeout(() => {
        // 先掛上 5 秒的 transition，再同時移除 letter-lit
        fills.forEach(fill => fill.classList.add("letter-dimming"));
        fills.forEach(fill => fill.classList.remove("letter-lit"));
        // 漸弱跑完後清掉輔助 class
        setTimeout(() => fills.forEach(fill => fill.classList.remove("letter-dimming")), DIM_DURATION);
      }, dimStart);

      // ── Phase 3：一輪結束，等短暫停頓後再重頭 ──
      const cycleTotal = dimStart + DIM_DURATION + PAUSE_DURATION;
      setTimeout(runCycle, cycleTotal);
    }

    runCycle();
  }
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
  history.replaceState(null, "", window.location.pathname);
}

function initCursorEffects() {
  const cursor = document.querySelector(".cursor-glow");
  if (!cursor || window.matchMedia("(pointer: coarse)").matches) return;

  window.addEventListener("pointermove", (event) => {
    const x = `${event.clientX}px`;
    const y = `${event.clientY}px`;
    root.style.setProperty("--mx", x);
    root.style.setProperty("--my", y);
    cursor.style.transform = `translate3d(${x}, ${y}, 0) translate(-50%, -50%)`;
  });

  document.querySelectorAll("a, button, input").forEach((element) => {
    element.addEventListener("mouseenter", () => cursor.classList.add("is-active"));
    element.addEventListener("mouseleave", () => cursor.classList.remove("is-active"));
  });
}

function initScrollProgress() {
  const progress = document.querySelector(".scroll-progress");
  if (!progress) return;

  const update = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = max <= 0 ? 0 : window.scrollY / max;
    progress.style.width = `${Math.min(1, Math.max(0, ratio)) * 100}%`;
  };

  update();
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
}

function initHeroCanvas() {
  const canvas = document.getElementById("hero-canvas");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!canvas || reduceMotion) return;

  const ctx = canvas.getContext("2d");
  const particles = [];
  let width = 0;
  let height = 0;
  let animationFrame = 0;
  const pointer = { x: 0, y: 0, active: false };

  const resize = () => {
    const ratio = window.devicePixelRatio || 1;
    width = canvas.offsetWidth;
    height = canvas.offsetHeight;
    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    particles.length = 0;
    const count = Math.min(90, Math.max(38, Math.floor(width / 18)));
    for (let i = 0; i < count; i += 1) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.38,
        vy: (Math.random() - 0.5) * 0.38,
        size: Math.random() * 1.8 + 0.8,
      });
    }
  };

  const draw = () => {
    ctx.clearRect(0, 0, width, height);
    ctx.lineWidth = 1;

    particles.forEach((particle, index) => {
      particle.x += particle.vx;
      particle.y += particle.vy;

      if (particle.x < 0 || particle.x > width) particle.vx *= -1;
      if (particle.y < 0 || particle.y > height) particle.vy *= -1;

      if (pointer.active) {
        const dx = pointer.x - particle.x;
        const dy = pointer.y - particle.y;
        const distance = Math.hypot(dx, dy);
        if (distance < 150) {
          particle.x -= dx * 0.002;
          particle.y -= dy * 0.002;
        }
      }

      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(98, 230, 169, 0.72)";
      ctx.fill();

      for (let next = index + 1; next < particles.length; next += 1) {
        const other = particles[next];
        const distance = Math.hypot(particle.x - other.x, particle.y - other.y);
        if (distance < 118) {
          ctx.beginPath();
          ctx.moveTo(particle.x, particle.y);
          ctx.lineTo(other.x, other.y);
          ctx.strokeStyle = `rgba(50, 212, 255, ${0.18 * (1 - distance / 118)})`;
          ctx.stroke();
        }
      }
    });

    animationFrame = requestAnimationFrame(draw);
  };

  canvas.addEventListener("pointermove", (event) => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
    pointer.active = true;
  });
  canvas.addEventListener("pointerleave", () => {
    pointer.active = false;
  });

  resize();
  draw();
  window.addEventListener("resize", resize);
  window.addEventListener("beforeunload", () => cancelAnimationFrame(animationFrame));
}
