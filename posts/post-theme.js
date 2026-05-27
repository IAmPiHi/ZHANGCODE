/* ═══════════════════════════════════════════════════════════
   ZHANGCODE Post Theme JS  ·  v2.0
   ─ Syntax highlighting (hljs)
   ─ Code block enhancement: header, language badge, copy btn
   ─ Auto Table of Contents
   ─ Reading time estimate
   ─ Scroll progress bar
   ─ Back to top button
   ─ Staggered entrance animations
   ─ Heading anchor links
   ═══════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    // 1. Syntax highlighting must run first
    if (window.hljs) {
      window.hljs.configure({ ignoreUnescapedHTML: true });
      window.hljs.highlightAll();
    }

    // 2. Enhancements (order matters: code blocks before TOC)
    addProgressBar();
    enhanceCodeBlocks();
    buildTOC();
    calcReadTime();
    addBackToTop();
    addHeadingAnchors();
    staggerAnimations();
  }

  /* ──────────────────────────────────────────────────────
     Reading Progress Bar
  ────────────────────────────────────────────────────── */
  function addProgressBar() {
    const bar = document.createElement("div");
    bar.className = "post-progress";
    document.body.prepend(bar);

    function update() {
      const max   = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = max <= 0 ? 0 : Math.min(1, Math.max(0, window.scrollY / max));
      bar.style.width = ratio * 100 + "%";
    }

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
  }

  /* ──────────────────────────────────────────────────────
     Code Block Enhancement
     Wraps every <pre> with .code-wrapper + header bar
     showing: macOS dots · language badge · line count · copy btn
  ────────────────────────────────────────────────────── */
  function enhanceCodeBlocks() {
    document.querySelectorAll("pre").forEach(function (pre) {
      // Skip if already wrapped
      if (pre.closest(".code-wrapper")) return;

      var codeEl    = pre.querySelector("code");
      var langMatch = codeEl && codeEl.className.match(/language-(\w+)/);
      var lang      = langMatch ? langMatch[1] : "code";
      var lineCount = (codeEl || pre).textContent.trim().split("\n").length;

      // ── Wrapper ──
      var wrapper = document.createElement("div");
      wrapper.className = "code-wrapper";

      // ── Header ──
      var header = document.createElement("div");
      header.className = "code-header";
      header.innerHTML =
        '<div class="code-header-left">' +
          '<div class="code-dots">' +
            '<span class="code-dot code-dot-red"></span>' +
            '<span class="code-dot code-dot-yellow"></span>' +
            '<span class="code-dot code-dot-green"></span>' +
          "</div>" +
          '<span class="code-lang">' + esc(lang) + "</span>" +
        "</div>" +
        '<div class="code-header-right">' +
          '<span class="code-lines">' + lineCount + " lines</span>" +
          '<button class="code-copy" type="button" aria-label="Copy code">' +
            svgCopy() + " Copy" +
          "</button>" +
        "</div>";

      // ── Mount ──
      pre.parentNode.insertBefore(wrapper, pre);
      wrapper.appendChild(header);
      wrapper.appendChild(pre);

      // ── Copy action ──
      var copyBtn = header.querySelector(".code-copy");
      copyBtn.addEventListener("click", function () {
        var text = codeEl ? codeEl.textContent : pre.textContent;
        copyToClipboard(text, copyBtn);
      });
    });
  }

  function copyToClipboard(text, btn) {
    var promise = navigator.clipboard
      ? navigator.clipboard.writeText(text)
      : Promise.reject();

    promise.catch(function () {
      // Fallback for non-HTTPS or old browsers
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.style.cssText = "position:fixed;top:-9999px;left:-9999px;opacity:0";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch (_) {}
      document.body.removeChild(ta);
    });

    // Feedback
    btn.classList.add("copied");
    btn.innerHTML = svgCheck() + " Copied!";

    setTimeout(function () {
      btn.classList.remove("copied");
      btn.innerHTML = svgCopy() + " Copy";
    }, 2400);
  }

  /* ──────────────────────────────────────────────────────
     Table of Contents
     Auto-generates from h2 / h3 inside <main>
     Inserts .post-toc before the first h2
  ────────────────────────────────────────────────────── */
  function buildTOC() {
    var headings = Array.from(document.querySelectorAll("main h2, main h3"));
    if (headings.length < 2) return;

    // Ensure IDs
    headings.forEach(function (h, i) {
      if (!h.id) h.id = "section-" + i;
    });

    // Build TOC container (div, not nav — nav gets position:fixed from site CSS)
    var toc = document.createElement("div");
    toc.className = "post-toc";
    toc.setAttribute("role", "navigation");
    toc.setAttribute("aria-label", "目錄");

    var tocHeader = document.createElement("div");
    tocHeader.className = "toc-header";
    tocHeader.innerHTML =
      svgList() + " 本文目錄";
    toc.appendChild(tocHeader);

    var ul = document.createElement("ul");
    ul.className = "toc-list";

    headings.forEach(function (h) {
      var li = document.createElement("li");
      li.className = h.tagName === "H3" ? "toc-h3" : "toc-h2";
      var a = document.createElement("a");
      a.href = "#" + h.id;
      // Strip anchor text if heading-anchor is present
      a.textContent = h.textContent.replace(/#\s*$/, "").trim();
      li.appendChild(a);
      ul.appendChild(li);
    });

    toc.appendChild(ul);

    // Insert before first h2 in <main>
    var main    = document.querySelector("main");
    var firstH2 = main && main.querySelector("h2");
    if (firstH2) {
      firstH2.parentNode.insertBefore(toc, firstH2);
    }

    // Active section highlight via IntersectionObserver
    if (!window.IntersectionObserver) return;
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        ul.querySelectorAll("li").forEach(function (li) {
          li.classList.remove("active");
        });
        var link = ul.querySelector('a[href="#' + entry.target.id + '"]');
        if (link) link.parentElement.classList.add("active");
      });
    }, { rootMargin: "-10% 0% -82% 0%" });

    headings.forEach(function (h) { observer.observe(h); });
  }

  /* ──────────────────────────────────────────────────────
     Reading Time
  ────────────────────────────────────────────────────── */
  function calcReadTime() {
    var el   = document.getElementById("readTime");
    var main = document.querySelector("main");
    if (!el || !main) return;
    var text    = main.innerText || main.textContent || "";
    var words   = text.trim().split(/\s+/).filter(Boolean).length;
    var minutes = Math.max(1, Math.round(words / 230));
    el.textContent = minutes + " 分鐘閱讀";
  }

  /* ──────────────────────────────────────────────────────
     Back to Top Button
  ────────────────────────────────────────────────────── */
  function addBackToTop() {
    var btn = document.createElement("button");
    btn.className = "back-to-top";
    btn.setAttribute("aria-label", "回到頂部");
    btn.title = "回到頂部";
    btn.innerHTML =
      '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" ' +
      'stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">' +
      '<polyline points="18 15 12 9 6 15"/></svg>';
    document.body.appendChild(btn);

    window.addEventListener("scroll", function () {
      btn.classList.toggle("visible", window.scrollY > 480);
    }, { passive: true });

    btn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* ──────────────────────────────────────────────────────
     Heading Anchor Links
  ────────────────────────────────────────────────────── */
  function addHeadingAnchors() {
    document.querySelectorAll("main h2, main h3").forEach(function (h) {
      if (!h.id) return;
      var a = document.createElement("a");
      a.className = "heading-anchor";
      a.href = "#" + h.id;
      a.textContent = "#";
      a.setAttribute("aria-hidden", "true");
      h.appendChild(a);
    });
  }

  /* ──────────────────────────────────────────────────────
     Staggered Entrance Animations
  ────────────────────────────────────────────────────── */
  function staggerAnimations() {
    var main = document.querySelector("main");
    if (!main) return;
    Array.from(main.children).forEach(function (el, i) {
      el.style.animationDelay = Math.min(i * 32, 300) + "ms";
    });
  }

  /* ──────────────────────────────────────────────────────
     SVG helpers (inline, no deps)
  ────────────────────────────────────────────────────── */
  function svgCopy() {
    return (
      '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" ' +
      'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      '<rect x="9" y="9" width="13" height="13" rx="2"/>' +
      '<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>' +
      "</svg>"
    );
  }

  function svgCheck() {
    return (
      '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" ' +
      'stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">' +
      '<polyline points="20 6 9 17 4 12"/>' +
      "</svg>"
    );
  }

  function svgList() {
    return (
      '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" ' +
      'stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">' +
      '<line x1="3" y1="6" x2="21" y2="6"/>' +
      '<line x1="3" y1="12" x2="15" y2="12"/>' +
      '<line x1="3" y1="18" x2="18" y2="18"/>' +
      "</svg>"
    );
  }

  /* ──────────────────────────────────────────────────────
     Utility
  ────────────────────────────────────────────────────── */
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
})();
