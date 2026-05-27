let blogsPerPage = window.matchMedia("(max-width: 900px)").matches ? 3 : 6;
let currentPage = 1;
let currentCategory = "all";
let searchKeyword = "";
let _isFirstBlogRender = true;

const categoryNames = {
  all: "全部",
  cs: "電腦科學",
  tools: "工具應用",
  programming: "程式語言",
  other: "其他議題",
};

const blogContainer = document.getElementById("blog-container");
const resultSummary = document.getElementById("result-summary");
const searchInput = document.getElementById("search-input");
const searchButton = document.getElementById("search-button");
const clearButton = document.getElementById("clear-button");
const prevButton = document.getElementById("prev-page");
const nextButton = document.getElementById("next-page");
const pageInfo = document.getElementById("page-info");

const orderedBlogs = Array.isArray(blogs) ? [...blogs].reverse() : [];

document.addEventListener("DOMContentLoaded", () => {
  bindEvents();
  renderBlogs();
  initScrollEffects();
});

function bindEvents() {
  document.querySelectorAll(".filter-btn").forEach((button) => {
    button.addEventListener("click", () => {
      currentCategory = button.dataset.category || "all";
      currentPage = 1;
      updateActiveFilterButton();
      renderBlogs();
    });
  });

  searchButton?.addEventListener("click", applySearch);
  clearButton?.addEventListener("click", clearSearch);
  searchInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") applySearch();
  });

  prevButton?.addEventListener("click", () => changePage(-1));
  nextButton?.addEventListener("click", () => changePage(1));

  window.addEventListener("resize", () => {
    const nextBlogsPerPage = window.matchMedia("(max-width: 900px)").matches ? 3 : 6;
    if (nextBlogsPerPage !== blogsPerPage) {
      blogsPerPage = nextBlogsPerPage;
      currentPage = 1;
      renderBlogs();
    }
  });
}

function getFilteredBlogs() {
  return orderedBlogs.filter((blog) => {
    const matchesCategory = currentCategory === "all" || blog.category === currentCategory;
    const haystack = `${blog.title} ${blog.desc}`.toLowerCase();
    const matchesSearch = !searchKeyword || haystack.includes(searchKeyword);
    return matchesCategory && matchesSearch;
  });
}

function renderBlogs() {
  if (!blogContainer) return;

  const filteredBlogs = getFilteredBlogs();
  const totalPages = Math.max(1, Math.ceil(filteredBlogs.length / blogsPerPage));
  currentPage = Math.min(currentPage, totalPages);

  const start = (currentPage - 1) * blogsPerPage;
  const visibleBlogs = filteredBlogs.slice(start, start + blogsPerPage);

  resultSummary.textContent = buildSummary(filteredBlogs.length);
  clearButton.hidden = !searchKeyword;
  blogContainer.innerHTML = "";

  if (visibleBlogs.length === 0) {
    blogContainer.innerHTML = `<div class="empty-state">目前沒有符合條件的文章。</div>`;
  } else {
    visibleBlogs.forEach((blog) => blogContainer.appendChild(createBlogCard(blog)));
  }

  // 卡片加入 DOM 後立刻同步設為不可見，避免出現一閃（不透過 RAF，在 paint 前完成）
  if (window.gsap) {
    const newCards = [...blogContainer.querySelectorAll(".blog-post")];
    if (newCards.length) gsap.set(newCards, { opacity: 0, y: 30 });
  }

  updatePagination(totalPages, filteredBlogs.length);

  // 觸發卡片進場動畫，並刷新 ScrollTrigger 位置
  const isFirst = _isFirstBlogRender;
  _isFirstBlogRender = false;
  requestAnimationFrame(() => {
    animateBlogCards(isFirst);
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  });
}

// ── Blog 卡片進場動畫 ─────────────────────────────────────────
function animateBlogCards(useScrollTrigger) {
  if (!window.gsap) return;

  const cards = [...blogContainer.querySelectorAll(".blog-post")];
  if (cards.length === 0) return;

  gsap.killTweensOf(cards);
  // 初始狀態已在 renderBlogs() 同步設定，此處不重複 set

  // 初次載入：等滾到 #blogs 才觸發
  const playInitial = () =>
    gsap.to(cards, {
      opacity: 1,
      y: 0,
      duration: 0.63,
      stagger: { amount: 0.36, from: "start", grid: "auto" },
      ease: "power2.out",
      clearProps: "all",
    });

  // 切換分類 / 搜尋 / 換頁：立刻彈入（帶 back.out 彈跳感）
  const playRefresh = () =>
    gsap.to(cards, {
      opacity: 1,
      y: 0,
      duration: 0.53,
      stagger: { amount: 0.24, from: "start", grid: "auto" },
      ease: "back.out(1.15)",
      clearProps: "all",
    });

  if (useScrollTrigger && window.ScrollTrigger) {
    ScrollTrigger.create({
      trigger: "#blogs",
      start: "top 82%",
      once: true,
      onEnter: playInitial,
    });
  } else {
    playRefresh();
  }
}

// ── Blog 卡片建立 ─────────────────────────────────────────────
function createBlogCard(blog) {
  const card = document.createElement("article");
  card.className = "blog-post";

  const safeTitle = escapeHtml(blog.title);
  const safeDesc = escapeHtml(blog.desc);
  const safeCategory = categoryNames[blog.category] || blog.category;

  card.innerHTML = `
    <a href="${blog.link}" class="blog-link" target="_blank" rel="noopener noreferrer">
      <div class="blog-image" style="background-image: url('${blog.img}')"></div>
      <div class="blog-content">
        <span class="blog-category">${safeCategory}</span>
        <h3>${safeTitle}</h3>
        <p>${safeDesc}</p>
      </div>
    </a>
  `;

  return card;
}

function buildSummary(count) {
  const category = categoryNames[currentCategory] || currentCategory;
  const searchText = searchKeyword ? ` / 搜尋「${searchInput.value.trim()}」` : "";
  return `${category}${searchText}：${count} 篇文章`;
}

function updatePagination(totalPages, totalItems) {
  pageInfo.textContent = totalItems === 0 ? "0 / 0" : `${currentPage} / ${totalPages}`;
  prevButton.disabled = currentPage <= 1 || totalItems === 0;
  nextButton.disabled = currentPage >= totalPages || totalItems === 0;
}

function changePage(direction) {
  currentPage += direction;
  renderBlogs();
  document.getElementById("blogs")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function applySearch() {
  searchKeyword = searchInput.value.trim().toLowerCase();
  currentPage = 1;
  renderBlogs();
}

function clearSearch() {
  searchInput.value = "";
  searchKeyword = "";
  currentPage = 1;
  renderBlogs();
}

function updateActiveFilterButton() {
  document.querySelectorAll(".filter-btn").forEach((button) => {
    button.classList.toggle("active", button.dataset.category === currentCategory);
  });
}

// ── Scroll 動畫總系統 ─────────────────────────────────────────
function initScrollEffects() {
  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  // 1. Section 整體淡入（start: "top bottom" 確保短頁面也能觸發）
  gsap.utils.toArray(".section-fade").forEach((section) => {
    gsap.fromTo(section,
      { opacity: 0, y: 34 },
      {
        opacity: 1, y: 0,
        duration: 0.85,
        ease: "power2.out",
        scrollTrigger: {
          trigger: section,
          start: "top bottom",
          once: true,   // 只播一次，ScrollTrigger.refresh() 不會重播造成閃爍
        },
      }
    );
  });

  // 2. Section 標題動畫：eyebrow 從左滑入 → h2 從下升起
  gsap.utils.toArray(".section-heading").forEach((heading) => {
    const eyebrow = heading.querySelector(".eyebrow");
    const h2 = heading.querySelector("h2");
    const tl = gsap.timeline({
      scrollTrigger: { trigger: heading, start: "top 87%", once: true },
    });
    if (eyebrow) {
      tl.fromTo(eyebrow,
        { x: -28, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.55, ease: "power2.out" }
      );
    }
    if (h2) {
      tl.fromTo(h2,
        { y: 22, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.67, ease: "power2.out", clearProps: "all" },
        "-=0.2"
      );
    }
  });

  // 3. About：code block 從左飛入、profile panel 從右飛入
  const codeBlock = document.querySelector(".about-text-container");
  const profilePanel = document.querySelector(".profile-panel");
  const aboutLayout = document.querySelector("#about .about-layout");
  if (aboutLayout) {
    if (codeBlock) {
      gsap.fromTo(codeBlock,
        { opacity: 0, x: -48 },
        {
          opacity: 1, x: 0, duration: 0.75, ease: "power3.out", clearProps: "all",
          scrollTrigger: { trigger: aboutLayout, start: "top 82%", once: true },
        }
      );
    }
    if (profilePanel) {
      gsap.fromTo(profilePanel,
        { opacity: 0, x: 48 },
        {
          opacity: 1, x: 0, duration: 0.75, ease: "power3.out", delay: 0.12, clearProps: "all",
          scrollTrigger: { trigger: aboutLayout, start: "top 82%", once: true },
        }
      );
    }
  }

  // 4. Hero 數據卡片：依序從下方彈入（hero 已在視野內，頁面載入後執行）
  const metrics = [...document.querySelectorAll(".hero-metrics div")];
  if (metrics.length) {
    gsap.fromTo(metrics,
      { opacity: 0, y: 24, scale: 0.88 },
      {
        opacity: 1, y: 0, scale: 1,
        duration: 0.65,
        stagger: 0.12,
        ease: "back.out(1.3)",
        delay: 1.92,
        clearProps: "all",
      }
    );
  }

  // 5. Contact：mail link 從下彈入
  const mailLink = document.querySelector(".mail-link");
  if (mailLink) {
    gsap.fromTo(mailLink,
      { opacity: 0, y: 18 },
      {
        opacity: 1, y: 0, duration: 0.65, ease: "power2.out", clearProps: "all",
        scrollTrigger: {
          trigger: mailLink,
          start: "top bottom",       // 同樣改成進入視窗即觸發
          once: true,
          invalidateOnRefresh: true,
        },
      }
    );
  }
}

// ── 工具函式 ──────────────────────────────────────────────────
function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
