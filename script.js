// script.js (corrected)

const arena = document.getElementById("arena");
const question = document.getElementById("questionText");
const yesBtn = document.getElementById("yesBtn");
const noBtn = document.getElementById("noBtn");

// --- SETTINGS ---
const repelRadius = 160;            // triggers when cursor this close to NO
const jumpMin = 420;                 // min distance for new target
const jumpMax = 1180;                // max distance for new target
const retargetCooldownMs = 1150;     // prevents target spam

const easeFar = 0.06;               // slow drift when far
const easeNear = 0.20;              // faster glide when close

const safeMargin = 70;
const edgeAvoidanceStrength = 0.85;
// ----------------

let pos = { x: 0, y: 0 };          // NO top-left (arena coords)
let target = { x: 0, y: 0 };       // NO target top-left
let mouse = { x: null, y: null, inside: false };
let lastRetarget = 0;

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function rectsOverlap(r1, r2, padding = 0) {
  return !(
    r1.right + padding < r2.left ||
    r1.left - padding > r2.right ||
    r1.bottom + padding < r2.top ||
    r1.top - padding > r2.bottom
  );
}

function arenaRect() {
  return arena.getBoundingClientRect();
}

function getRects() {
  const a = arenaRect();
  const b = noBtn.getBoundingClientRect();
  const c = yesBtn.getBoundingClientRect();
  const q = question ? question.getBoundingClientRect() : null;
  return { a, b, c, q };
}

// IMPORTANT: left/top only work if position is not "static"
function ensurePositioning() {
  // CSS should ideally set .arena { position: relative; }
  // but we enforce it here too:
  arena.style.position = arena.style.position || "relative";

  yesBtn.style.position = "absolute";
  noBtn.style.position = "absolute";
}

// Place YES and NO next to each other (NO is movable)
function setStartPositions() {
  ensurePositioning();
  const { a, b, c } = getRects();

  // Choose a nice starting Y near the top/middle
  const startY = (a.height - b.height) * 3 / 4;

  // Put the pair roughly centered as a group
  const gap = 60;
  const groupWidth = c.width + gap + b.width;

  const startX = (a.width - groupWidth) / 2;

  // YES (static)
  yesBtn.style.left = `${startX}px`;
  yesBtn.style.top = `${startY}px`;

  // NO (runaway) — set BOTH the style AND internal pos to match
  pos.x = startX + c.width + gap;
  pos.y = startY;
  target.x = pos.x;
  target.y = pos.y;

  noBtn.style.left = `${pos.x}px`;
  noBtn.style.top = `${pos.y}px`;
}

function updateMouse(e) {
  const a = arenaRect();
  mouse.x = e.clientX - a.left;
  mouse.y = e.clientY - a.top;
  mouse.inside =
    mouse.x >= 0 && mouse.y >= 0 && mouse.x <= a.width && mouse.y <= a.height;
}

arena.addEventListener("mousemove", updateMouse);
arena.addEventListener("mouseenter", (e) => {
  updateMouse(e);
  mouse.inside = true;
});
arena.addEventListener("mouseleave", () => {
  mouse.inside = false;
  mouse.x = null;
  mouse.y = null;
});

function distanceToMouseFromNoCenter() {
  if (!mouse.inside || mouse.x == null) return Infinity;
  const { b } = getRects();
  const cx = pos.x + b.width / 2;
  const cy = pos.y + b.height / 2;
  return Math.hypot(cx - mouse.x, cy - mouse.y);
}

function proximity01(dist) {
  if (!isFinite(dist)) return 0;
  const t = 1 - clamp(dist / repelRadius, 0, 1);
  return t * t; // gentle until close
}

function safetyScore(x, y, maxX, maxY) {
  const dL = x;
  const dR = maxX - x;
  const dT = y;
  const dB = maxY - y;
  const minEdge = Math.min(dL, dR, dT, dB);
  return clamp(minEdge / safeMargin, 0, 1);
}

// Don’t let NO stop over YES or over the question text
function targetIsAllowed(nx, ny) {
  const { a, b, c, q } = getRects();
  const candidate = {
    left: a.left + nx,
    top: a.top + ny,
    right: a.left + nx + b.width,
    bottom: a.top + ny + b.height,
  };

  // YES rect (viewport)
  const yesRect = {
    left: a.left + parseFloat(yesBtn.style.left || "0"),
    top: a.top + parseFloat(yesBtn.style.top || "0"),
    right:
      a.left +
      parseFloat(yesBtn.style.left || "0") +
      c.width,
    bottom:
      a.top +
      parseFloat(yesBtn.style.top || "0") +
      c.height,
  };

  const padding = 10;
  if (rectsOverlap(candidate, yesRect, padding)) return false;
  if (q && rectsOverlap(candidate, q, padding)) return false;

  return true;
}

function pickNearbyTargetAwayFromMouse() {
  const now = Date.now();
  if (now - lastRetarget < retargetCooldownMs) return;
  lastRetarget = now;

  const { a, b } = getRects();
  const maxX = a.width - b.width;
  const maxY = a.height - b.height;

  // Direction away from mouse
  let awayX = 0, awayY = 0;
  if (mouse.inside && mouse.x != null) {
    const cx = pos.x + b.width / 2;
    const cy = pos.y + b.height / 2;
    const dx = cx - mouse.x;
    const dy = cy - mouse.y;
    const d = Math.hypot(dx, dy) || 1;
    awayX = dx / d;
    awayY = dy / d;
  } else {
    const ang = Math.random() * Math.PI * 2;
    awayX = Math.cos(ang);
    awayY = Math.sin(ang);
  }

  let best = { x: target.x, y: target.y, score: -Infinity };
  const candidates = 14;

  for (let i = 0; i < candidates; i++) {
    const dist = jumpMin + Math.random() * (jumpMax - jumpMin);

    // sideways jitter ±45°
    const jitterAng = (Math.random() - 0.5) * (Math.PI / 2);
    const cos = Math.cos(jitterAng),
      sin = Math.sin(jitterAng);
    const dirX = awayX * cos - awayY * sin;
    const dirY = awayX * sin + awayY * cos;

    let nx = pos.x + dirX * dist;
    let ny = pos.y + dirY * dist;

    // gentle center bias to avoid corners
    const centerX = maxX / 2;
    const centerY = maxY / 2;
    nx = lerp(nx, centerX, edgeAvoidanceStrength * 0.10);
    ny = lerp(ny, centerY, edgeAvoidanceStrength * 0.10);

    nx = clamp(nx, 0, maxX);
    ny = clamp(ny, 0, maxY);

    if (!targetIsAllowed(nx, ny)) continue;

    let mouseScore = 1;
    if (mouse.inside && mouse.x != null) {
      const cX = nx + b.width / 2;
      const cY = ny + b.height / 2;
      const dMouse = Math.hypot(cX - mouse.x, cY - mouse.y);
      mouseScore = clamp(dMouse / repelRadius, 0, 1);
    }

    const safe = safetyScore(nx, ny, maxX, maxY);
    const total = mouseScore * 0.55 + safe * 0.45;

    if (total > best.score) best = { x: nx, y: ny, score: total };
  }

  target.x = best.x;
  target.y = best.y;
}

// Optional: if they somehow click NO
noBtn.addEventListener("click", (e) => {
    e.preventDefault();
    window.location.href = "no/no.html"
});

function animate() {
  const dist = distanceToMouseFromNoCenter();

  if (dist < repelRadius) {
    pickNearbyTargetAwayFromMouse();
  }

  const p = proximity01(dist);
  const ease = lerp(easeFar, easeNear, p);

  pos.x += (target.x - pos.x) * ease;
  pos.y += (target.y - pos.y) * ease;

  noBtn.style.left = `${pos.x}px`;
  noBtn.style.top = `${pos.y}px`;

  requestAnimationFrame(animate);
}

window.addEventListener("resize", setStartPositions);

// Run after layout is ready
window.addEventListener("load", () => {
  setStartPositions();
  requestAnimationFrame(animate);
});



/* ====================== page linking ===================== */

// const style = document.body.dataset.style;

// const links = {
//     style1: "yes_page_2.html",
//     style2: "yes_page_2.html"
// }

// yesBtn.href = links[style] ?? "yes_page_2.html"