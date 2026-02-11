const hearts = document.getElementById("hearts");
const heartChars = ["❤", "💖", "💗", "💘", "💕"];

function spawnHeart(){
  const h = document.createElement("div");
  h.className = "heart";
  h.textContent = heartChars[Math.floor(Math.random() * heartChars.length)];

  // Random start X across the screen
  const x = Math.random() * 100;
  h.style.left = `${x}vw`;

  // Random size & drift
  const scale = 0.8 + Math.random() * 1.6;     // 0.8..2.4
  const drift = (Math.random() * 2 - 1) * 120; // -120..120 px
  h.style.setProperty("--scale", scale.toFixed(2));
  h.style.setProperty("--drift", `${drift.toFixed(0)}px`);

  // Random duration
  const dur = 4.5 + Math.random() * 4.0; // 4.5..8.5s
  h.style.animationDuration = `${dur}s`;

  // Slight random delay for natural feel
  h.style.animationDelay = `${Math.random() * 0.4}s`;

  hearts.appendChild(h);

  // Cleanup
  setTimeout(() => h.remove(), (dur + 1) * 1000);
}

// Spawn rate (lower = more hearts)
setInterval(spawnHeart, 180);
