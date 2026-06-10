// GitHub Projects 渲染器
// 讀取 githubprojects.js 的靜態資料，並嘗試從 GitHub REST API 更新即時 star 數

const GITHUB_USER = "IAmPiHi";

document.addEventListener("DOMContentLoaded", () => {
  if (!Array.isArray(githubProjects) || githubProjects.length === 0) return;
  renderProjects(githubProjects);
  fetchLiveStars();
  animateProjectCards();
});

function renderProjects(projects) {
  const grid = document.getElementById("projects-grid");
  if (!grid) return;

  grid.innerHTML = "";
  projects.forEach((project) => {
    grid.appendChild(createProjectCard(project));
  });
}

function createProjectCard(project) {
  const card = document.createElement("a");
  card.className = "project-card";
  card.href = project.url;
  card.target = "_blank";
  card.rel = "noopener noreferrer";
  card.dataset.repo = project.name;
  card.style.setProperty("--accent", project.langColor || "var(--cyan)");

  const ogImage = `https://opengraph.githubassets.com/1/${GITHUB_USER}/${project.name}`;

  card.innerHTML = `
    <div class="project-topbar">
      <span class="code-dots-mini" aria-hidden="true"><i></i><i></i><i></i></span>
      <span class="project-path">${GITHUB_USER} / <b>${escapeHtml(project.name)}</b></span>
      <span class="project-badge">PUBLIC</span>
    </div>
    <div class="project-thumb" style="background-image:url('${ogImage}')">
      <div class="project-thumb-scrim"></div>
    </div>
    <div class="project-card-body">
      <span class="project-name">${escapeHtml(project.name)}</span>
      <p class="project-desc">${escapeHtml(project.desc)}</p>
      <div class="project-meta">
        <span class="project-lang">
          <span class="lang-dot" style="background:${project.langColor}"></span>
          ${escapeHtml(project.language)}
        </span>
        <span class="project-stars" data-stars="${project.name}">
          <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"/>
          </svg>
          ${project.stars}
        </span>
        <span class="project-link-cue">查看專案 →</span>
      </div>
    </div>
  `;

  return card;
}

// ── Project 卡片進場動畫 ───────────────────────────────────────
function animateProjectCards() {
  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  const cards = [...document.querySelectorAll(".project-card")];
  if (cards.length === 0) return;

  // 初始設為不可見 + 往下偏移
  gsap.set(cards, { opacity: 0, y: 36 });

  ScrollTrigger.create({
    trigger: "#projects",
    start: "top 78%",
    once: true,
    onEnter: () => {
      gsap.to(cards, {
        opacity: 1,
        y: 0,
        duration: 0.67,
        stagger: 0.14,       // 每張卡片間隔 0.14s 依序飛入
        ease: "power3.out",
        delay: 0.2,          // 等 section 淡入後再飛入
        clearProps: "all",
      });
    },
  });
}

// ── GitHub REST API：更新即時 star 數 ──────────────────────────
function fetchLiveStars() {
  if (!Array.isArray(githubProjects)) return;

  githubProjects.forEach((project) => {
    fetch(`https://api.github.com/repos/${GITHUB_USER}/${project.name}`)
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        const starEl = document.querySelector(`[data-stars="${project.name}"]`);
        if (starEl) {
          starEl.innerHTML = `
            <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"/>
            </svg>
            ${data.stargazers_count}
          `;
        }
      })
      .catch(() => {
        // 靜默失敗，保留靜態資料
      });
  });
}

// escapeHtml 已由 script2.js 提供，此處不重複定義
