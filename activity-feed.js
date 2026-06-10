// 「最新動態」時間軸
// 把最新的文章與置頂的 GitHub 專案交織成一條動態流，
// 讓首頁不只是靜態介紹，也能呈現「最近在忙什麼」。
// 資料來源：allpost.js 的 `blogs`、githubprojects.js 的 `githubProjects`
// 不需要額外維護資料，新增文章/專案後會自動反映在這裡。

document.addEventListener("DOMContentLoaded", () => {
  const feed = document.getElementById("activity-feed");
  if (!feed) return;

  const items = [];

  // 注意：const 宣告的全域不會掛在 window 上，須用 typeof 檢查
  const blogData = typeof blogs !== "undefined" ? blogs : window.blogs;
  const projectData = typeof githubProjects !== "undefined" ? githubProjects : window.githubProjects;

  // 取最新 3 篇文章（陣列尾端視為最新新增）
  if (Array.isArray(blogData) && blogData.length) {
    blogData.slice(-3).reverse().forEach((post) => {
      items.push({
        type: "post",
        tag: "新文章",
        icon: "✎",
        title: post.title,
        desc: post.desc,
        link: post.link,
      });
    });
  }

  // 取前 2 個置頂專案
  if (Array.isArray(projectData) && projectData.length) {
    projectData.slice(0, 2).forEach((project) => {
      items.push({
        type: "project",
        tag: "置頂專案",
        icon: "</>",
        title: project.name,
        desc: project.desc,
        link: project.url,
      });
    });
  }

  if (items.length === 0) {
    feed.innerHTML = `<p class="result-summary">目前還沒有動態內容。</p>`;
    return;
  }

  feed.innerHTML = items.map(renderItem).join("");
  animateFeed();
});

function renderItem(item) {
  const isExternal = /^https?:\/\//.test(item.link);
  const linkAttrs = isExternal ? `target="_blank" rel="noopener noreferrer"` : "";

  return `
    <a class="activity-item" href="${item.link}" ${linkAttrs} data-type="${item.type}">
      <span class="activity-dot" aria-hidden="true">${item.icon}</span>
      <span class="activity-body">
        <span class="activity-tag">${escapeHtml(item.tag)}</span>
        <span class="activity-title">${escapeHtml(item.title)}</span>
        <p class="activity-desc">${escapeHtml(item.desc || "")}</p>
      </span>
    </a>
  `;
}

function animateFeed() {
  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  const items = [...document.querySelectorAll(".activity-item")];
  if (items.length === 0) return;

  gsap.set(items, { opacity: 0, x: -30 });

  ScrollTrigger.create({
    trigger: "#activity",
    start: "top 78%",
    once: true,
    onEnter: () => {
      gsap.to(items, {
        opacity: 1,
        x: 0,
        duration: 0.6,
        stagger: 0.12,
        ease: "power3.out",
        delay: 0.15,
        clearProps: "all",
      });
    },
  });
}

// escapeHtml 已由 script2.js 提供，此處不重複定義
