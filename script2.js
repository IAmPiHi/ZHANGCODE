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
  if (window.gsap && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
  bindEvents();
  renderBlogs();
  // 場景滾動編排已移交 cinema.js，本檔只負責文章資料邏輯與卡片動畫
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
    if (event.key === "Escape") {
      clearSearch();
      searchInput.blur();
    }
  });

  // 即時搜尋：邊打邊過濾（180ms debounce，不用再按搜尋鈕）
  let _searchDebounce;
  searchInput?.addEventListener("input", () => {
    clearTimeout(_searchDebounce);
    _searchDebounce = setTimeout(applySearch, 180);
  });

  // 按「/」快速聚焦搜尋框（輸入框內不觸發）
  document.addEventListener("keydown", (event) => {
    if (event.key !== "/" || event.ctrlKey || event.metaKey || event.altKey) return;
    const tag = document.activeElement?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || document.activeElement?.isContentEditable) return;
    event.preventDefault();
    searchInput?.focus();
    searchInput?.select();
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

  // 觸發卡片進場動畫
  const isFirst = _isFirstBlogRender;
  _isFirstBlogRender = false;
  requestAnimationFrame(() => {
    animateBlogCards(isFirst);
    lockBlogGridHeight();
    maybeRefreshTriggers();
  });
}

// ── 文章網格高度鎖定 ─────────────────────────────────────────
// 策略說明：換頁/搜尋會增減卡片，若頁面總高度跟著變，理論上要
// 全頁 ScrollTrigger.refresh()；但 refresh 與「釘住的 Hero」互動
// 非常脆弱（量測時機稍有閃失就會出現頂部空白、動畫全滅）。
// 折衷：以滿頁卡片的高度鎖住網格 min-height → 頁面總高度恆定
// → 正常操作下完全不需要 refresh，從根本杜絕問題。
function lockBlogGridHeight() {
  if (!blogContainer) return;
  if (!blogContainer.style.minHeight && blogContainer.offsetHeight > 0) {
    blogContainer.style.minHeight = blogContainer.offsetHeight + "px";
  }
}

// 視窗尺寸改變時重新鎖定（ScrollTrigger 本來就會在 resize 自動刷新）
let _gridResizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(_gridResizeTimer);
  _gridResizeTimer = setTimeout(() => {
    if (!blogContainer) return;
    blogContainer.style.minHeight = "";
    requestAnimationFrame(lockBlogGridHeight);
  }, 200);
});

// ── 保險絲：僅在頁面總高度「真的變了」才安排刷新（罕見情況）──
let _lastDocHeight = 0;
function maybeRefreshTriggers() {
  const h = document.documentElement.scrollHeight;
  if (_lastDocHeight === 0) {
    _lastDocHeight = h; // 首次渲染：記錄基準
    return;
  }
  if (h !== _lastDocHeight) {
    _lastDocHeight = h;
    scheduleScrollTriggerRefresh();
  }
}

// 等捲動完全靜止才刷新（連續兩次取樣相同 = 靜止）。
// 另外：若使用者正位於頂部 Hero 釘住區附近，直接放棄這次刷新 ——
// 在釘住邊界上拆裝 pin 結構會在標題上方留下空白區塊；
// 而刷新的目的只是校正「下方」區塊的觸發點，在頂部時本來就不需要。
let _stRefreshTimer;
function scheduleScrollTriggerRefresh() {
  if (!window.ScrollTrigger) return;
  clearTimeout(_stRefreshTimer);
  let lastY = -1;
  const check = () => {
    const y = window.scrollY;
    if (y === lastY) {
      if (y > window.innerHeight * 2.3) ScrollTrigger.refresh();
      return;
    }
    lastY = y;
    _stRefreshTimer = setTimeout(check, 220);
  };
  _stRefreshTimer = setTimeout(check, 220);
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

// ── 工具函式 ──────────────────────────────────────────────────
function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
