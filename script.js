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
  const heroContent = document.querySelector(".hero-content");
  if (!textEl || !heroContent || !window.gsap) return;

  // ZHANGCODE 跳完需要 2 秒，在那個時間點建立光束並掃過
  setTimeout(() => {
    // 量第一個字母（Z）和最後一個字母（E）的實際位置
    const firstLetter = textEl.querySelector(".letter-wrapper:first-child");
    const lastLetter  = textEl.querySelector(".letter-wrapper:last-child");
    if (!firstLetter || !lastLetter) return;

    const parentRect = heroContent.getBoundingClientRect();
    const textRect   = textEl.getBoundingClientRect();
    const startX = firstLetter.getBoundingClientRect().left  - parentRect.left;
    const endX   = lastLetter.getBoundingClientRect().right  - parentRect.left;
    const textW  = endX - startX;   // 從 Z 左緣到 E 右緣的實際寬度

    const sweep  = document.createElement("div");
    sweep.className = "hero-sweep";
    sweep.setAttribute("aria-hidden", "true");

    // 橢圓光圈：橫向稍寬（w = h * 1.35）
    const h      = textRect.height * 3.4;
    const w      = h * 1.35;
    const halfW  = w / 2;
    const halfH  = h / 2;

    sweep.style.width  = `${w}px`;
    sweep.style.height = `${h}px`;
    sweep.style.left   = `${startX}px`;
    sweep.style.top    = `${textRect.top - parentRect.top + textRect.height / 2 - halfH}px`;

    heroContent.appendChild(sweep);

    // 左→右→左 來回掃光，每次到端點停 1.5s
    gsap.fromTo(sweep,
      { x: -halfW },
      {
        x: textW - halfW,
        duration: 3.2,
        ease: "power1.inOut",
        repeat: -1,       // 無限循環
        yoyo: true,       // 原路折返（右→左與左→右速度相同）
        repeatDelay: 1.5, // 每次到端點停 1.5s 再折返
      }
    );
  }, 2000);
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
