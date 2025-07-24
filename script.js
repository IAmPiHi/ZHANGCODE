const text = "在熱情被現實澆熄以前 好好燃燒吧!";
const target = document.getElementById("animated-text");

let delay = 0;
target.style.fontSize = "5rem";
[...text].forEach((char, i) => {
  const wrapper = document.createElement("span");
  wrapper.classList.add("letter-wrapper");
  wrapper.style.animationDelay = `${delay}s`;

  const outline = document.createElement("span");
  outline.classList.add("letter-outline");
  outline.textContent = char;

  const fill = document.createElement("span");
  fill.classList.add("letter-fill");
  fill.textContent = char;

  wrapper.appendChild(outline);
  wrapper.appendChild(fill);
  target.appendChild(wrapper);

  delay += 0.2; // 節奏更快更炸
});

// LOGO變化
setTimeout(() => {
  target.innerHTML = "";
  target.style.fontSize = "10rem";

  const finalText = "ZHANGCODE";
  [...finalText].forEach((char, i) => {
    const wrapper = document.createElement("span");
    wrapper.classList.add("letter-wrapper");
    wrapper.style.animationDelay = `${i * 0.2}s`;

    const outline = document.createElement("span");
    outline.classList.add("letter-outline");
    outline.textContent = char;

    const fill = document.createElement("span");
    fill.classList.add("letter-fill");
    fill.textContent = char;

    wrapper.appendChild(outline);
    wrapper.appendChild(fill);
    target.appendChild(wrapper);

    // ❗加入閃光延遲效果：每個字延遲後加上 lightshine 效果
    setTimeout(() => {
      wrapper.classList.add("glow-loop");
    }, i * 200 + 4000); // 第一秒等待動畫跑完，再逐個開始閃
  });
}, text.length * 200 + 1500);


function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
