/* ═══════════════════════════════════════════════════════════════
   ZHANGCODE · CINEMA ENGINE  v1.0
   ─ FX：全站粒子背景引擎（各場景換色 / 換行為、滾動速度感應、
         Hero 曲速噴射、滑鼠視差）
   ─ 場景編排：GSAP ScrollTrigger（Hero 釘住縮放轉場、
         區塊 clip-path 絲滑交接、退場淡出）
   ─ 文字解碼（scramble）、HUD 四角括號、右側場景導軌
   ─ 自訂游標、導覽列自動隱藏、滾動進度、浮動回頂部
   依賴：gsap + ScrollTrigger（CDN）
   ═══════════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var MOBILE =
    window.matchMedia("(max-width: 900px)").matches ||
    window.matchMedia("(pointer: coarse)").matches;

  var SCENES = ["hero", "about", "projects", "activity", "blogs", "contact"];
  var SCENE_LABELS = {
    hero: "TOP",
    about: "01 · 關於",
    projects: "02 · 專案",
    activity: "03 · 動態",
    blogs: "04 · 文章",
    contact: "05 · 聯繫",
  };

  /* 代碼雨字符集（about 場景）：中文 + 程式符號 */
  var GLYPHS = "程式碼資料演算邏輯函式變數迴圈陣列指標01<>#+*=$&%ZHANGCODE";

  /* 全域：logo 與頁尾按鈕的 onclick 會呼叫 */
  window.scrollToTop = function () {
    window.scrollTo({ top: 0, behavior: REDUCED ? "auto" : "smooth" });
    history.replaceState(null, "", window.location.pathname);
  };

  /* ════════════════════════════════════════════════════════════
     FX · 粒子背景引擎
     ════════════════════════════════════════════════════════════ */
  var FX = {
    warp: 0, // 0~1，由 Hero 釘住進度餵入 → 曲速噴射
    presets: {
      hero:     { c1: [50, 212, 255], c2: [98, 230, 169],  link: 120, speed: 0.45, flow: [0, 0],      orbit: 0 },
      about:    { c1: [98, 230, 169], c2: [50, 212, 255],  link: 95,  speed: 0.28, flow: [0, -0.12],  orbit: 0 },
      projects: { c1: [50, 212, 255], c2: [112, 183, 255], link: 150, speed: 0.3,  flow: [0.1, 0],    orbit: 0 },
      activity: { c1: [98, 230, 169], c2: [245, 195, 91],  link: 0,   speed: 0.55, flow: [0.55, 0],   orbit: 0 },
      blogs:    { c1: [245, 195, 91], c2: [255, 184, 201], link: 0,   speed: 0.22, flow: [0, 0.14],   orbit: 0 },
      contact:  { c1: [255, 122, 154], c2: [245, 195, 91], link: 110, speed: 0.26, flow: [0, 0],      orbit: 1 },
    },

    init: function () {
      window.__FX = this; // 除錯用入口
      this.canvas = document.getElementById("fx-canvas");
      if (!this.canvas) return;
      this.ctx = this.canvas.getContext("2d");
      this.particles = [];
      this.mx = 0;
      this.my = 0;
      this.scrollV = 0;
      this.lastY = window.scrollY;

      // 目前參數（朝目標 preset 平滑過渡）
      var p = this.presets.hero;
      this.cur = {
        c1: p.c1.slice(), c2: p.c2.slice(),
        link: p.link, speed: p.speed,
        flow: p.flow.slice(), orbit: p.orbit,
      };
      this.target = p;

      // 場景樣式轉場狀態（新舊樣式交叉淡化）
      this.mode = "hero";
      this.prevMode = null;
      this.modeT = 1;     // 0 → 1 轉場進度
      this.time = 0;      // 全域時鐘（搖曳/閃爍用）
      this.pulses = [];   // 沿連線奔跑的資料脈衝

      this.resize();
      window.addEventListener("resize", this.resize.bind(this));

      if (!MOBILE) {
        window.addEventListener("pointermove", function (e) {
          FX.mx = (e.clientX / window.innerWidth - 0.5) * 2;
          FX.my = (e.clientY / window.innerHeight - 0.5) * 2;
        }, { passive: true });
      }

      if (REDUCED) {
        this.drawStatic();
        return;
      }
      this.loop = this.loop.bind(this);
      requestAnimationFrame(this.loop);
    },

    resize: function () {
      var ratio = Math.min(window.devicePixelRatio || 1, 2);
      this.w = window.innerWidth;
      this.h = window.innerHeight;
      this.canvas.width = Math.floor(this.w * ratio);
      this.canvas.height = Math.floor(this.h * ratio);
      this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

      var count = MOBILE ? 38 : Math.min(100, Math.max(52, Math.floor(this.w / 17)));
      this.particles.length = 0;

      // 分層佈點（stratified sampling）：把畫面切成 cols×rows 格，
      // 每格放一顆 + 格內隨機抖動 → 初始分布即視覺均勻，
      // 不會像純隨機那樣天生帶有疏密叢塊
      var cols = Math.max(2, Math.round(Math.sqrt(count * this.w / Math.max(1, this.h))));
      var rows = Math.max(2, Math.ceil(count / cols));

      for (var i = 0; i < count; i += 1) {
        var gc = i % cols;
        var gr = (i / cols) | 0;
        this.particles.push({
          x: ((gc + Math.random()) / cols) * this.w,
          y: ((gr % rows + Math.random()) / rows) * this.h,
          z: 0.35 + Math.random() * 0.65,          // 深度（視差/大小/速度）
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          r: Math.random() * 2 + 0.7,
          tone: Math.random(),                     // 0~1 → c1/c2 混色
          phase: Math.random() * Math.PI * 2,      // 個體相位（搖曳/閃爍）
          ch: GLYPHS[(Math.random() * GLYPHS.length) | 0], // 代碼雨字符
        });
      }
    },

    setMode: function (name) {
      if (!this.presets[name] || name === this.mode) return;
      this.prevMode = this.mode;
      this.mode = name;
      this.modeT = 0;
      this.target = this.presets[name];
    },

    lerp: function (a, b, t) { return a + (b - a) * t; },

    /* 最稀疏帶選位：回傳該帶內的隨機座標，並把計數 +1
       （避免同一幀多顆重生全擠進同一帶） */
    sparseX: function () {
      var c = this.colC;
      if (!c) return Math.random() * this.w;
      var mi = 0;
      for (var i = 1; i < c.length; i += 1) if (c[i] < c[mi]) mi = i;
      c[mi] += 1;
      return ((mi + Math.random()) / c.length) * this.w;
    },

    sparseY: function () {
      var r = this.rowC;
      if (!r) return Math.random() * this.h;
      var mi = 0;
      for (var i = 1; i < r.length; i += 1) if (r[i] < r[mi]) mi = i;
      r[mi] += 1;
      return ((mi + Math.random()) / r.length) * this.h;
    },

    tick: function () {
      var t = 0.035; // 過渡平滑度
      var cur = this.cur, tg = this.target;
      for (var i = 0; i < 3; i += 1) {
        cur.c1[i] = this.lerp(cur.c1[i], tg.c1[i], t);
        cur.c2[i] = this.lerp(cur.c2[i], tg.c2[i], t);
      }
      cur.link = this.lerp(cur.link, tg.link, t);
      cur.speed = this.lerp(cur.speed, tg.speed, t);
      cur.flow[0] = this.lerp(cur.flow[0], tg.flow[0], t);
      cur.flow[1] = this.lerp(cur.flow[1], tg.flow[1], t);
      cur.orbit = this.lerp(cur.orbit, tg.orbit, t);

      // 滾動速度（平滑）→ 動態拉絲
      var y = window.scrollY;
      this.scrollV = this.lerp(this.scrollV, y - this.lastY, 0.12);
      this.lastY = y;

      // 全域時鐘 + 場景樣式轉場推進
      this.time += 0.016;
      if (this.modeT < 1) this.modeT = Math.min(1, this.modeT + 0.02);

      // 曲速強度：每幀直接由「目前捲動位置」推導（無狀態純函數）。
      // 舊版靠 ScrollTrigger 回呼設定/歸零，快速滾動或動畫中刷新時
      // 回呼順序會錯亂，warp 卡在非零值 → 畫面四角殘留放射拉絲線。
      // 改為位置推導後不可能卡住；鐘形曲線（漸強→漸弱）收尾也更順。
      var hp = y / (window.innerHeight * 1.1); // Hero 釘住區間 = 110vh
      this.warp = (hp > 0.001 && hp < 0.999) ? Math.sin(hp * Math.PI) : 0;
    },

    rgba: function (c, a) {
      return "rgba(" + (c[0] | 0) + "," + (c[1] | 0) + "," + (c[2] | 0) + "," + a + ")";
    },

    mix: function (t) {
      var c1 = this.cur.c1, c2 = this.cur.c2;
      return [
        c1[0] + (c2[0] - c1[0]) * t,
        c1[1] + (c2[1] - c1[1]) * t,
        c1[2] + (c2[2] - c1[2]) * t,
      ];
    },

    loop: function () {
      this.tick();
      var ctx = this.ctx, w = this.w, h = this.h;
      var cur = this.cur;
      var cx = w / 2, cy = h / 2;
      var warp = this.warp;
      var sv = Math.max(-46, Math.min(46, this.scrollV));
      var time = this.time;
      var mode = this.mode, prev = this.prevMode, mt = this.modeT;

      ctx.clearRect(0, 0, w, h);

      // 雙色環境光暈（比舊版更濃，主色在上、副色在右下）
      var glow = ctx.createRadialGradient(cx, h * 0.38, 0, cx, h * 0.38, Math.max(w, h) * 0.75);
      glow.addColorStop(0, this.rgba(cur.c1, 0.055));
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);
      var glow2 = ctx.createRadialGradient(w * 0.82, h * 0.85, 0, w * 0.82, h * 0.85, Math.max(w, h) * 0.5);
      glow2.addColorStop(0, this.rgba(cur.c2, 0.035));
      glow2.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow2;
      ctx.fillRect(0, 0, w, h);

      var pts = this.particles, i, p;

      // ── 密度直方圖：供「換邊重生」挑選最稀疏的帶 ──
      // 流動型場景（橫向資料流、直落代碼雨、曲速擴散）會讓粒子
      // 逐漸聚集到某側；透過直方圖讓離場的粒子永遠補進最稀疏
      // 的區域，分布持續自我均勻化，且不受特效切換影響。
      var XB = 6, YB = 4;
      var colC = this.colC || (this.colC = new Array(XB));
      var rowC = this.rowC || (this.rowC = new Array(YB));
      for (i = 0; i < XB; i += 1) colC[i] = 0;
      for (i = 0; i < YB; i += 1) rowC[i] = 0;
      for (i = 0; i < pts.length; i += 1) {
        p = pts[i];
        colC[Math.min(XB - 1, Math.max(0, (p.x / w * XB) | 0))] += 1;
        rowC[Math.min(YB - 1, Math.max(0, (p.y / h * YB) | 0))] += 1;
      }

      // ── 移動：基礎漂移 + 場景專屬行為（轉場時新舊行為加權混合）──
      for (i = 0; i < pts.length; i += 1) {
        p = pts[i];
        var spd = cur.speed * (0.5 + p.z);
        p.x += p.vx * spd;
        p.y += p.vy * spd - sv * 0.06 * p.z;

        this.applyBehavior(mode, p, mt, cx, cy, time);
        if (prev && mt < 1) this.applyBehavior(prev, p, 1 - mt, cx, cy, time);

        // hero 曲速：向外噴射
        if (warp > 0.01) {
          p.x += (p.x - cx) * 0.012 * warp * p.z;
          p.y += (p.y - cy) * 0.012 * warp * p.z;
        }

        // 邊界環繞：從對側進場，且進場座標選在最稀疏的帶
        if (p.x > w + 40)      { p.x = -38;    p.y = this.sparseY(); }
        else if (p.x < -40)    { p.x = w + 38; p.y = this.sparseY(); }
        if (p.y > h + 40)      { p.y = -38;    p.x = this.sparseX(); }
        else if (p.y < -40)    { p.y = h + 38; p.x = this.sparseX(); }
      }

      // ── 霓虹疊加模式：重疊的光會相加，更有放射感 ──
      ctx.globalCompositeOperation = "lighter";

      // 連線網（link > 0 的場景）
      if (cur.link > 6) this.drawLinks(ctx);

      // 沿連線奔跑的資料脈衝
      this.updatePulses(ctx, cur.link);

      // 粒子本體：新舊場景樣式交叉淡化
      for (i = 0; i < pts.length; i += 1) {
        p = pts[i];
        this.drawParticle(ctx, mode, p, mt, cx, cy, time, sv, warp);
        if (prev && mt < 1) this.drawParticle(ctx, prev, p, 1 - mt, cx, cy, time, sv, warp);
      }

      ctx.globalCompositeOperation = "source-over";

      requestAnimationFrame(this.loop);
    },

    /* ── 場景專屬移動行為 ──────────────────────────────────── */
    applyBehavior: function (mode, p, k, cx, cy, time) {
      if (k <= 0) return;
      switch (mode) {
        case "about": // 代碼雨：直落 + 微幅搖擺（放慢）
          p.y += (0.42 + p.z * 0.95) * k;
          p.x += Math.sin(time * 0.8 + p.phase) * 0.06 * k;
          break;
        case "activity": // 資料流：橫向掃過（放慢）
          p.x += (0.7 + p.z * 1.15) * k;
          p.y += Math.sin(time * 1.3 + p.phase) * 0.18 * k;
          break;
        case "blogs": // 餘燼：上飄 + 搖曳（文章區加強版）
          p.y -= (0.32 + p.z * 0.58) * k;
          p.x += Math.sin(time * 0.85 + p.phase) * 0.52 * k;
          break;
        case "contact": // 環繞：各自以固定半徑繞中心旋轉（不向內縮）
          var dx = p.x - cx, dy = p.y - cy;
          var ang = 0.0016 * k * (0.4 + p.z * 0.6); // 角速度（深度越深轉越快）
          var ca = Math.cos(ang), sa = Math.sin(ang);
          p.x = cx + dx * ca - dy * sa;
          p.y = cy + dx * sa + dy * ca;
          break;
        // hero / projects：基礎漂移即可
      }
    },

    /* ── 連線網（亮度隨距離、線寬隨距離）─────────────────────── */
    drawLinks: function (ctx) {
      var pts = this.particles, cur = this.cur;
      var linkDist = cur.link;
      var i, j, p, q;
      for (i = 0; i < pts.length; i += 1) {
        p = pts[i];
        for (j = i + 1; j < pts.length; j += 1) {
          q = pts[j];
          var ddx = p.x - q.x, ddy = p.y - q.y;
          var dist = Math.sqrt(ddx * ddx + ddy * ddy);
          if (dist < linkDist) {
            var near = 1 - dist / linkDist;
            ctx.beginPath();
            ctx.moveTo(p.x + this.mx * p.z * 18, p.y + this.my * p.z * 12);
            ctx.lineTo(q.x + this.mx * q.z * 18, q.y + this.my * q.z * 12);
            ctx.strokeStyle = this.rgba(cur.c1, 0.14 * near);
            ctx.lineWidth = 0.5 + near * 0.8;
            ctx.stroke();
          }
        }
      }
    },

    /* ── 資料脈衝：亮點沿連線奔跑（projects / hero / contact）── */
    updatePulses: function (ctx, linkDist) {
      var pts = this.particles, cur = this.cur;

      if (linkDist > 6 && this.pulses.length < 4 && Math.random() < 0.07) {
        var a = pts[(Math.random() * pts.length) | 0];
        for (var n = 0; n < 14; n += 1) {
          var b = pts[(Math.random() * pts.length) | 0];
          var dx = a.x - b.x, dy = a.y - b.y;
          if (a !== b && dx * dx + dy * dy < linkDist * linkDist) {
            this.pulses.push({ a: a, b: b, t: 0 });
            break;
          }
        }
      }

      for (var i = this.pulses.length - 1; i >= 0; i -= 1) {
        var pu = this.pulses[i];
        pu.t += 0.035;
        if (pu.t >= 1) { this.pulses.splice(i, 1); continue; }
        var x = pu.a.x + (pu.b.x - pu.a.x) * pu.t;
        var y = pu.a.y + (pu.b.y - pu.a.y) * pu.t;
        var fade = Math.sin(pu.t * Math.PI);
        ctx.beginPath();
        ctx.arc(x, y, 2.4, 0, Math.PI * 2);
        ctx.fillStyle = this.rgba(cur.c2, 0.85 * fade);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fillStyle = this.rgba(cur.c2, 0.16 * fade);
        ctx.fill();
      }
    },

    /* ── 粒子本體：依場景切換繪製樣式 ────────────────────────── */
    drawParticle: function (ctx, mode, p, weight, cx, cy, time, sv, warp) {
      if (weight <= 0.01) return;
      var px = p.x + this.mx * p.z * 18;
      var py = p.y + this.my * p.z * 12;
      var col = this.mix(p.tone);
      var alpha = (0.35 + p.z * 0.5) * weight;

      // 曲速 / 快速滾動 → 拉絲（所有場景共用，優先權最高）
      // 拉絲長度與透明度都乘上 warp 平滑漸入，並把整體長度減半、
      // 透明度降低 —— 避免快速滾動時放射線過密（視覺暫留像一片線海）
      if (warp > 0.1) {
        var wx = (p.x - cx) * 0.13 * warp * p.z;
        var wy = (p.y - cy) * 0.13 * warp * p.z;
        ctx.beginPath();
        ctx.moveTo(px - wx, py - wy - sv * 0.6 * p.z);
        ctx.lineTo(px, py);
        ctx.strokeStyle = this.rgba(col, alpha * 0.55 * Math.min(1, warp + 0.3));
        ctx.lineWidth = p.r * 0.85;
        ctx.lineCap = "round";
        ctx.stroke();
        return;
      }
      var streakY = sv * 1.2 * p.z;
      if (Math.abs(streakY) > 5) {
        ctx.beginPath();
        ctx.moveTo(px, py - streakY);
        ctx.lineTo(px, py);
        ctx.strokeStyle = this.rgba(col, alpha * 0.9);
        ctx.lineWidth = p.r;
        ctx.lineCap = "round";
        ctx.stroke();
        return;
      }

      switch (mode) {
        case "about": // ── 代碼雨：字符 + 殘影尾巴 ──
          if (p.tone < 0.25) { this.glowDot(ctx, px, py, p, col, alpha); break; }
          var size = 9 + p.z * 6;
          ctx.font = size + "px Consolas, monospace";
          if (Math.random() < 0.025) p.ch = GLYPHS[(Math.random() * GLYPHS.length) | 0];
          ctx.fillStyle = this.rgba([200, 255, 224], Math.min(1, alpha * 1.25));
          ctx.fillText(p.ch, px, py);
          ctx.fillStyle = this.rgba(col, alpha * 0.4);
          ctx.fillText(p.ch, px, py - size);
          break;

        case "activity": // ── 彗星：漸層拖尾 + 亮頭 ──
          var len = 14 + p.z * 30;
          var grad = ctx.createLinearGradient(px - len, py, px, py);
          grad.addColorStop(0, this.rgba(col, 0));
          grad.addColorStop(1, this.rgba(col, alpha));
          ctx.beginPath();
          ctx.moveTo(px - len, py);
          ctx.lineTo(px, py);
          ctx.strokeStyle = grad;
          ctx.lineWidth = p.r * 1.4;
          ctx.lineCap = "round";
          ctx.stroke();
          this.glowDot(ctx, px, py, p, col, alpha);
          break;

        case "blogs": // ── 餘燼：高亮三層光暈 + 白熱亮核 + 火花 ──
          // 閃爍下限拉高（0.65），確保任何時刻都有足夠存在感
          var flick = 0.65 + 0.35 * Math.sin(time * 2.6 + p.phase * 5);
          var ea = Math.min(1, alpha * 1.7) * flick;
          // 第一層：柔光暈（回到正常尺寸，亮度保留）
          ctx.beginPath();
          ctx.arc(px, py, p.r * (2.5 + p.z), 0, Math.PI * 2);
          ctx.fillStyle = this.rgba(col, ea * 0.18);
          ctx.fill();
          // 第二層：中層色暈
          ctx.beginPath();
          ctx.arc(px, py, p.r * 1.4, 0, Math.PI * 2);
          ctx.fillStyle = this.rgba(col, ea * 0.5);
          ctx.fill();
          // 第三層：白熱亮核
          ctx.beginPath();
          ctx.arc(px, py, p.r * (0.8 + p.z * 0.4), 0, Math.PI * 2);
          ctx.fillStyle = this.rgba([255, 240, 200], Math.min(1, ea * 1.15));
          ctx.fill();
          // 火花十字
          if (p.r > 1.45) {
            var s = 4 + p.z * 5;
            ctx.strokeStyle = this.rgba(col, ea * 0.9);
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(px - s, py); ctx.lineTo(px + s, py);
            ctx.moveTo(px, py - s); ctx.lineTo(px, py + s);
            ctx.stroke();
          }
          break;

        case "contact": // ── 漩渦：沿軌道切線拖尾 ──
          var dx = px - cx, dy = py - cy;
          var d = Math.sqrt(dx * dx + dy * dy) || 1;
          var tx = -dy / d, ty = dx / d;
          var tl = 10 + p.z * 26;
          var grad2 = ctx.createLinearGradient(px - tx * tl, py - ty * tl, px, py);
          grad2.addColorStop(0, this.rgba(col, 0));
          grad2.addColorStop(1, this.rgba(col, alpha * 0.9));
          ctx.beginPath();
          ctx.moveTo(px - tx * tl, py - ty * tl);
          ctx.lineTo(px, py);
          ctx.strokeStyle = grad2;
          ctx.lineWidth = p.r;
          ctx.lineCap = "round";
          ctx.stroke();
          this.glowDot(ctx, px, py, p, col, alpha);
          break;

        default: // ── hero / projects：霓虹光點（hero 大星帶十字閃光）──
          this.glowDot(ctx, px, py, p, col, alpha);
          if (mode === "hero" && p.r > 2.2 && p.z > 0.85) {
            var twinkle = 0.5 + 0.5 * Math.sin(time * 1.6 + p.phase * 4);
            var s2 = 4 + twinkle * 5;
            ctx.strokeStyle = this.rgba(col, alpha * 0.35 * twinkle);
            ctx.lineWidth = 0.7;
            ctx.beginPath();
            ctx.moveTo(px - s2, py); ctx.lineTo(px + s2, py);
            ctx.moveTo(px, py - s2); ctx.lineTo(px, py + s2);
            ctx.stroke();
          }
      }
    },

    /* 光暈點：外圈柔光 + 內圈亮核 */
    glowDot: function (ctx, px, py, p, col, alpha) {
      ctx.beginPath();
      ctx.arc(px, py, p.r * (2.1 + p.z * 0.8), 0, Math.PI * 2);
      ctx.fillStyle = this.rgba(col, alpha * 0.1);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(px, py, p.r * (0.8 + p.z * 0.5), 0, Math.PI * 2);
      ctx.fillStyle = this.rgba(col, Math.min(1, alpha * 1.1));
      ctx.fill();
    },

    /* 減少動態：畫一張靜態星點 */
    drawStatic: function () {
      var ctx = this.ctx;
      for (var i = 0; i < this.particles.length; i += 1) {
        var p = this.particles[i];
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = this.rgba(this.cur.c1, 0.3 + p.z * 0.3);
        ctx.fill();
      }
    },
  };

  /* ════════════════════════════════════════════════════════════
     文字解碼（scramble decode）
     ════════════════════════════════════════════════════════════ */
  var SCRAMBLE_CHARS = "!<>-_\\/[]{}=+*^?#@$%&01▓▒░";

  function scramble(el) {
    if (el.dataset.scrambled) return;
    el.dataset.scrambled = "1";
    var original = el.textContent;
    var len = original.length;
    var frame = 0;
    var totalFrames = Math.max(18, len * 2.2);

    function step() {
      frame += 1;
      var progress = frame / totalFrames;
      var resolved = Math.floor(progress * len);
      var out = "";
      for (var i = 0; i < len; i += 1) {
        if (i < resolved || original[i] === " ") {
          out += original[i];
        } else {
          out += SCRAMBLE_CHARS[(Math.random() * SCRAMBLE_CHARS.length) | 0];
        }
      }
      el.textContent = out;
      if (frame < totalFrames) {
        requestAnimationFrame(step);
      } else {
        el.textContent = original;
      }
    }
    requestAnimationFrame(step);
  }

  /* ════════════════════════════════════════════════════════════
     DOM 建構：Hero 標題、HUD 括號、場景標籤、導軌
     ════════════════════════════════════════════════════════════ */
  function buildHeroTitle() {
    var target = document.getElementById("animated-text");
    if (!target) return;
    var text = "ZHANGCODE";
    target.innerHTML = "";
    for (var i = 0; i < text.length; i += 1) {
      var span = document.createElement("span");
      span.className = "letter";
      span.textContent = text[i];
      target.appendChild(span);
    }
  }

  function buildHudCorners() {
    document.querySelectorAll(".scene-shell").forEach(function (shell) {
      ["tl", "tr", "br", "bl"].forEach(function (pos) {
        var c = document.createElement("span");
        c.className = "hud-c " + pos;
        shell.appendChild(c);
      });
    });
  }

  function buildSceneTags() {
    document.querySelectorAll(".scene:not(.scene-hero)").forEach(function (scene) {
      var shell = scene.querySelector(".scene-shell");
      if (!shell) return;
      var tag = document.createElement("span");
      tag.className = "scene-tag";
      tag.setAttribute("aria-hidden", "true");
      tag.textContent = "SCENE " + (scene.dataset.num || "") + " · " + (scene.dataset.scene || "").toUpperCase();
      shell.appendChild(tag);
    });
  }

  function buildRail() {
    if (MOBILE) return;
    var rail = document.createElement("nav");
    rail.className = "scene-rail";
    rail.setAttribute("aria-label", "場景導覽");

    SCENES.forEach(function (name) {
      var dot = document.createElement("button");
      dot.className = "rail-dot";
      dot.type = "button";
      dot.dataset.rail = name;
      dot.setAttribute("aria-label", SCENE_LABELS[name]);
      var label = document.createElement("span");
      label.className = "rail-label";
      label.textContent = SCENE_LABELS[name];
      dot.appendChild(label);
      dot.addEventListener("click", function () {
        var sec = document.getElementById(name);
        if (name === "hero") window.scrollToTop();
        else if (sec) sec.scrollIntoView({ behavior: REDUCED ? "auto" : "smooth" });
      });
      rail.appendChild(dot);
    });
    document.body.appendChild(rail);
  }

  /* ════════════════════════════════════════════════════════════
     導覽列 / 進度條 / 游標 / 回頂部
     ════════════════════════════════════════════════════════════ */
  function initNavBehavior() {
    var header = document.querySelector(".site-header");
    if (!header) return;
    var lastY = window.scrollY;
    window.addEventListener("scroll", function () {
      var y = window.scrollY;
      if (y > 260 && y > lastY + 4) header.classList.add("nav-hidden");
      else if (y < lastY - 4 || y < 260) header.classList.remove("nav-hidden");
      lastY = y;
    }, { passive: true });
  }

  function initScrollProgress() {
    var bar = document.querySelector(".scroll-progress");
    if (!bar) return;
    function update() {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var ratio = max <= 0 ? 0 : Math.min(1, Math.max(0, window.scrollY / max));
      bar.style.width = ratio * 100 + "%";
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
  }

  function initCursor() {
    if (MOBILE || REDUCED) return;
    var dot = document.querySelector(".cursor-dot");
    var ring = document.querySelector(".cursor-ring");
    if (!dot || !ring) return;

    var tx = -100, ty = -100; // 目標
    var rx = -100, ry = -100; // ring 目前（lerp 追隨）

    window.addEventListener("pointermove", function (e) {
      tx = e.clientX;
      ty = e.clientY;
      dot.style.transform = "translate(" + tx + "px," + ty + "px) translate(-50%,-50%)";
    }, { passive: true });

    (function follow() {
      rx += (tx - rx) * 0.16;
      ry += (ty - ry) * 0.16;
      ring.style.transform = "translate(" + rx + "px," + ry + "px) translate(-50%,-50%)";
      requestAnimationFrame(follow);
    })();

    document.addEventListener("pointerover", function (e) {
      if (e.target.closest("a, button, input, .rail-dot")) ring.classList.add("is-active");
    });
    document.addEventListener("pointerout", function (e) {
      if (e.target.closest("a, button, input, .rail-dot")) ring.classList.remove("is-active");
    });
  }

  function initFabTop() {
    var btn = document.createElement("button");
    btn.className = "fab-top";
    btn.type = "button";
    btn.setAttribute("aria-label", "回到頂部");
    btn.title = "回到頂部";
    btn.innerHTML =
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>';
    document.body.appendChild(btn);
    btn.addEventListener("click", window.scrollToTop);
    window.addEventListener("scroll", function () {
      btn.classList.toggle("visible", window.scrollY > window.innerHeight);
    }, { passive: true });
  }

  /* ════════════════════════════════════════════════════════════
     場景偵測：FX 換模式 + 導覽列 / 導軌 active 同步
     ════════════════════════════════════════════════════════════ */
  function watchScenes() {
    SCENES.forEach(function (name) {
      var sec = document.getElementById(name);
      if (!sec) return;

      function activate() {
        FX.setMode(name);
        document.querySelectorAll(".nav-links a").forEach(function (a) {
          a.classList.toggle("is-active", a.dataset.nav === name);
        });
        document.querySelectorAll(".rail-dot").forEach(function (d) {
          d.classList.toggle("is-active", d.dataset.rail === name);
        });
      }

      if (window.ScrollTrigger && !REDUCED) {
        ScrollTrigger.create({
          trigger: sec,
          start: "top 50%",
          end: "bottom 50%",
          onToggle: function (self) { if (self.isActive) activate(); },
        });
      } else if (window.IntersectionObserver) {
        new IntersectionObserver(function (entries) {
          entries.forEach(function (en) { if (en.isIntersecting) activate(); });
        }, { rootMargin: "-45% 0% -45% 0%" }).observe(sec);
      }
    });
  }

  /* ════════════════════════════════════════════════════════════
     HERO 場景：進場 + 釘住曲速退場
     ════════════════════════════════════════════════════════════ */
  function choreographHero() {
    var hero = document.getElementById("hero");
    if (!hero) return;
    var letters = hero.querySelectorAll(".letter");

    // ── 進場 ──
    var tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.from(letters, {
        rotationX: -95,
        z: -420,
        opacity: 0,
        filter: "blur(10px)",
        duration: 1.1,
        stagger: { each: 0.07, from: "random" },
      }, 0.25)
      .from(".hero-eyebrow", { y: -18, opacity: 0, duration: 0.6 }, 0.1)
      .from(".hero-copy", { y: 20, opacity: 0, duration: 0.6 }, "-=0.55")
      .from(".hero-metrics div", {
        scale: 0.2, opacity: 0, duration: 0.5,
        stagger: 0.12, ease: "back.out(1.7)",
      }, "-=0.35")
      .from(".hero-actions > *", { y: 16, opacity: 0, stagger: 0.1, duration: 0.5 }, "-=0.3")
      .from(".hero-hud span", { opacity: 0, stagger: 0.12, duration: 0.7 }, "-=0.4")
      .from(".scroll-cue", { opacity: 0, duration: 0.6 }, "-=0.3");

    // ── 隨機字母 glitch ──
    setInterval(function () {
      if (document.hidden || !letters.length) return;
      var el = letters[(Math.random() * letters.length) | 0];
      el.classList.add("glitching");
      setTimeout(function () { el.classList.remove("glitching"); }, 560);
    }, 2600);

    if (MOBILE) return; // 行動裝置不釘住，保持輕量

    // 硬性還原 Hero 至靜止狀態（與 scrub 進度 0 的值完全一致，
    // 即使 scrub 補間稍後才跑完也會收斂到同樣的值，不會打架）
    function resetHeroVisuals() {
      gsap.set("#animated-text", { scale: 1, rotationX: 0, y: 0 });
      gsap.set(".hero-inner", { scale: 1, opacity: 1, filter: "blur(0px)", visibility: "visible" });
      gsap.set(".scroll-cue, .hero-hud span", { opacity: 1 });
    }

    // 看門狗：只要使用者真的捲到最頂端，無條件復位。
    // 就算先前任何量測/刷新時機出錯導致 scrub 進度回不到 0，
    // 標題也保證會回來。
    window.addEventListener("scroll", function () {
      if (window.scrollY <= 1) resetHeroVisuals();
    }, { passive: true });

    // 釘住自癒：實測發現 ScrollTrigger 的內部狀態（認為已釘住、
    // progress=0）有時會與 DOM 脫鉤 —— hero 實際停在「解除釘住」
    // 的位置（往下位移約一個 pin 距離），於是標題上方出現整塊
    // 空白，且沒有任何機制會自動修正。
    // 此巡邏每 900ms 檢查一次：人在頂端但 hero 沒貼齊視口頂
    // → 復位視覺 + 強制重新量測（只在壞掉時觸發，冪等安全）。
    setInterval(function () {
      if (window.scrollY > 1 || !window.ScrollTrigger) return;
      var top = hero.getBoundingClientRect().top;
      if (Math.abs(top) > 2 && !ScrollTrigger.isRefreshing) {
        resetHeroVisuals();
        ScrollTrigger.refresh();
      }
    }, 900);

    // ── 釘住 + 曲速退場（scrub）──
    // 修正說明：scrub 動畫一律用 fromTo + 明確起始值（靜止狀態），
    // 否則若使用者在「進場動畫還沒播完」時就開始滾動，.to() 會把
    // 字母半透明的中途狀態記成起點，往上倒轉時標題就回不來了。
    gsap.timeline({
      scrollTrigger: {
        trigger: hero,
        start: "top top",
        end: "+=110%",
        pin: true,
        scrub: 0.8,
        refreshPriority: 1,
        onUpdate: function (self) {
          // 一開始滾動就快轉完進場動畫，避免兩組 tween 互搶屬性
          // （曲速 FX.warp 已改由 FX.tick 依捲動位置無狀態推導）
          if (self.progress > 0.02 && tl.isActive()) tl.progress(1);
        },
        // 保險：捲回釘住區起點（頁面頂端）時硬性復位
        onLeaveBack: resetHeroVisuals,
      },
    })
      .fromTo(".scroll-cue, .hero-hud span",
        { opacity: 1 },
        { opacity: 0, duration: 0.12, immediateRender: false }, 0)
      // 架構原則：scrub 絕不觸碰 .letter（那是進場動畫的專屬目標）。
      // 同元素同屬性被兩組動畫寫入，時序一亂（refresh / 快速滾動 /
      // 分頁切換）就會留下「字母卡在隱形」的壞狀態 —— 改為只動
      // 標題容器 #animated-text 與 .hero-inner 整體，屬性零重疊。
      .fromTo("#animated-text",
        { scale: 1, rotationX: 0, y: 0, transformPerspective: 900, transformOrigin: "50% 50%" },
        {
          scale: 1.18,
          rotationX: 14,
          y: -46,
          ease: "power2.in",
          duration: 0.8,
          immediateRender: false,
        }, 0.05)
      .fromTo(".hero-inner",
        { scale: 1, opacity: 1, filter: "blur(0px)" },
        {
          scale: 1.4,
          opacity: 0,
          filter: "blur(9px)",
          ease: "power2.in",
          duration: 0.8,
          immediateRender: false,
        }, 0.1);
  }

  /* ════════════════════════════════════════════════════════════
     一般場景：clip-path 絲滑交接 + 內容進場 + 退場淡出
     ════════════════════════════════════════════════════════════ */
  function choreographScenes() {
    document.querySelectorAll(".scene:not(.scene-hero)").forEach(function (scene) {
      var shell = scene.querySelector(".scene-shell");
      if (!shell) return;

      if (!MOBILE) {
        // 進場：從「裂縫」展開成完整面板（scrub，雙向絲滑）
        // 修正說明：
        // 1. 透明度最低只到 0.5，且觸發帶縮窄到畫面下緣
        //    （top 97% → top 55%）。往回滑時，區塊只會在接近
        //    畫面底部、即將離開時才反向收合，不會在畫面中間
        //    就變半透明、標題消失。
        gsap.fromTo(shell,
          {
            clipPath: "inset(14% 7% 42% 7% round 18px)",
            scale: 0.94,
            autoAlpha: 0.5,
            rotationX: 7,
            transformPerspective: 1100,
            transformOrigin: "50% 0%",
          },
          {
            clipPath: "inset(0% 0% 0% 0% round 12px)",
            scale: 1,
            autoAlpha: 1,
            rotationX: 0,
            ease: "none",
            scrollTrigger: {
              trigger: scene,
              start: "top 97%",
              end: "top 55%",
              scrub: 0.6,
            },
          }
        );

        // 退場：改為「純位移視差」，完全不碰透明度。
        // （舊版 gsap.to 同時動 autoAlpha，會把頁面載入時的
        //   半透明狀態記成 tween 起始值，往回滑時區塊就永遠
        //   卡在半透明 → 此為上次回報問題的主因，已修正）
        gsap.fromTo(shell,
          { yPercent: 0 },
          {
            yPercent: -3.5,
            ease: "none",
            immediateRender: false,
            scrollTrigger: {
              trigger: scene,
              start: "bottom 42%",
              end: "bottom 8%",
              scrub: 0.6,
            },
          }
        );

      } else {
        gsap.fromTo(shell,
          { y: 40, autoAlpha: 0 },
          {
            y: 0, autoAlpha: 1, duration: 0.8, ease: "power2.out",
            scrollTrigger: { trigger: scene, start: "top 85%", once: true },
          }
        );
      }

      // 內容進場（once）：HUD 括號 + 標題解碼 + eyebrow
      ScrollTrigger.create({
        trigger: scene,
        start: "top 58%",
        once: true,
        onEnter: function () {
          shell.classList.add("hud-on");
          var h2 = scene.querySelector("h2[data-scramble]");
          if (h2) scramble(h2);
          var eyebrow = scene.querySelector(".eyebrow");
          if (eyebrow) {
            gsap.fromTo(eyebrow, { x: -26, opacity: 0 },
              { x: 0, opacity: 1, duration: 0.55, ease: "power2.out" });
          }
        },
      });
    });

    // About：程式碼逐行輸入
    var codeLines = document.querySelectorAll("#about .code-line");
    if (codeLines.length) {
      gsap.set(codeLines, { opacity: 0, x: -22 });
      ScrollTrigger.create({
        trigger: "#about",
        start: "top 55%",
        once: true,
        onEnter: function () {
          gsap.to(codeLines, {
            opacity: 1, x: 0,
            duration: 0.4,
            stagger: 0.09,
            ease: "power2.out",
            clearProps: "all",
          });
        },
      });
    }

    // Contact：終端機逐行輸出
    var tLines = document.querySelectorAll("#contact .t-line");
    if (tLines.length) {
      gsap.set(tLines, { opacity: 0, x: -16 });
      ScrollTrigger.create({
        trigger: "#contact",
        start: "top 55%",
        once: true,
        onEnter: function () {
          gsap.to(tLines, {
            opacity: 1, x: 0,
            duration: 0.38,
            stagger: 0.17,
            ease: "power2.out",
            clearProps: "all",
          });
        },
      });
    }
  }

  /* 降級：不跑滾動編排時，直接顯示所有內容 */
  function revealAllStatic() {
    document.querySelectorAll(".scene-shell").forEach(function (shell) {
      shell.classList.add("hud-on");
    });
    document.querySelectorAll("h2[data-scramble]").forEach(function (h2) {
      h2.dataset.scrambled = "1";
    });
  }

  /* ════════════════════════════════════════════════════════════
     卡片互動：滑鼠光暈（事件委派，動態卡片也適用）+ 3D 傾斜
     ════════════════════════════════════════════════════════════ */
  function initCardGlow() {
    if (MOBILE) return;
    document.addEventListener("pointermove", function (e) {
      var card = e.target.closest(".project-card");
      if (!card) return;
      var rect = card.getBoundingClientRect();
      card.style.setProperty("--gx", ((e.clientX - rect.left) / rect.width) * 100 + "%");
      card.style.setProperty("--gy", ((e.clientY - rect.top) / rect.height) * 100 + "%");
    }, { passive: true });
  }

  function initTiltCards() {
    if (MOBILE || REDUCED) return;
    document.querySelectorAll(".tilt-card").forEach(function (card) {
      card.addEventListener("pointermove", function (e) {
        var rect = card.getBoundingClientRect();
        var px = (e.clientX - rect.left) / rect.width - 0.5;
        var py = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform =
          "perspective(900px) rotateY(" + px * 7 + "deg) rotateX(" + -py * 7 + "deg)";
      });
      card.addEventListener("pointerleave", function () {
        card.style.transform = "";
      });
    });
  }

  /* ════════════════════════════════════════════════════════════
     啟動
     ════════════════════════════════════════════════════════════ */
  document.addEventListener("DOMContentLoaded", function () {
    var hasGsap = !!(window.gsap && window.ScrollTrigger);
    if (hasGsap) gsap.registerPlugin(ScrollTrigger);

    FX.init();
    buildHeroTitle();
    buildHudCorners();
    buildSceneTags();
    buildRail();
    initNavBehavior();
    initScrollProgress();
    initCursor();
    initFabTop();
    initCardGlow();
    initTiltCards();

    if (hasGsap && !REDUCED) {
      choreographHero();
      choreographScenes();
    } else {
      revealAllStatic();
    }

    watchScenes();
  });
})();
