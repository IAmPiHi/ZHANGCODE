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

  delay += 0.2; 
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

    
    setTimeout(() => {
      wrapper.classList.add("glow-loop");
    }, i * 200 + 4000); 
  });
}, text.length * 200 + 1500);


function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
  location.hash = '';
}
