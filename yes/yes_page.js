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




// --- NEW: floating pictures ---
const floatPics = document.getElementById("floatPics");

// Put your image paths here
const picSources = [
  "../images/faces/face_pawan_1.png",
  "../images/faces/face_pawan_2.png",
  "../images/faces/face_pawan_4.png",
  "../images/faces/face_pawan_5.png",
  "../images/faces/face_pawan_6.png",
  "../images/faces/face_pawan_7.png",
  "../images/faces/face_pawan_8.png",
  "../images/faces/face_supipi_1.png",
  "../images/faces/face_supipi_2.png",
  "../images/faces/face_supipi_3.png",
  "../images/faces/face_supipi_4.png",
  "../images/faces/face_supipi_5.png",
  "../images/faces/face_supipi_6.png",
  "../images/faces/face_supipi_7.png",
  "../images/faces/face_couple_1.png",
  "../images/faces/face_couple_1.png",
  "../images/faces/face_couple_1.png",
];

// Spawn one picture occasionally (not too many)
function spawnPic(){
  const img = document.createElement("img");
  img.className = "floatPic";
  img.src = picSources[Math.floor(Math.random() * picSources.length)];
  img.alt = "";

  // Random X across screen
  img.style.left = `${Math.random() * 100}vw`;

  // Size, drift, rotation, scale
  const w = 40 + Math.random() * 55;          // 40..95px
  const drift = (Math.random() * 2 - 1) * 240; // -140..140px
  const rot = (-12 + Math.random() * 24);      // -12..+12 deg
  const scale = 0.85 + Math.random() * 0.5;    // 0.85..1.35

  img.style.setProperty("--w", `${w.toFixed(0)}px`);
  img.style.setProperty("--drift", `${drift.toFixed(0)}px`);
  img.style.setProperty("--rot", `${rot.toFixed(1)}deg`);
  img.style.setProperty("--scale", scale.toFixed(2));

  // Duration
  const dur = 6 + Math.random() * 5; // 6..11s
  img.style.animationDuration = `${dur}s`;

  floatPics.appendChild(img);

  // Cleanup
  setTimeout(() => img.remove(), (dur + 1) * 1000);
}

// Spawn a “couple” randomly: ~1 every 1.2s (tweak this)
setInterval(spawnPic, 1250);