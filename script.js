const arena = document.getElementById("arena");
const btn   = document.getElementById("btn");

// --- SUBTLE TEASE SETTINGS ---
const repelRadius = 160;            // triggers when cursor this close
const jumpMin = 560;                 // min distance for new target
const jumpMax = 1050;                // max distance for new target (vicinity size)
const retargetCooldownMs = 50 //260;     // slower retargeting feels more “teasy”

// Dynamic ease (closer = faster)
const easeFar  = 0.06;              // when cursor far (slow drift)
const easeNear = 0.20;              // when cursor very close (faster glide)

// Edge/corner avoidance
const safeMargin = 70;              // “safe zone” distance from edges
const edgeAvoidanceStrength = 0.85; // 0..1 : higher = more central bias
// ----------------------------

let pos = { x: 0, y: 0 };       // current top-left
let target = { x: 0, y: 0 };    // target top-left
let mouse = { x: null, y: null, inside: false };
let lastRetarget = 0;

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function getRects() {
  const a = arena.getBoundingClientRect();
  const b = btn.getBoundingClientRect();
  return { a, b };
}

function setCenterStart() {
  const { a, b } = getRects();
  pos.x = (a.width - b.width) / 2;
  pos.y = (a.height - b.height) / 2;
  target.x = pos.x;
  target.y = pos.y;
  btn.style.left = `${pos.x}px`;
  btn.style.top  = `${pos.y}px`;
}

function updateMouse(e) {
  const a = arena.getBoundingClientRect();
  mouse.x = e.clientX - a.left;
  mouse.y = e.clientY - a.top;
  mouse.inside = mouse.x >= 0 && mouse.y >= 0 && mouse.x <= a.width && mouse.y <= a.height;
}

arena.addEventListener("mousemove", updateMouse);
arena.addEventListener("mouseenter", (e) => { updateMouse(e); mouse.inside = true; });
arena.addEventListener("mouseleave", () => { mouse.inside = false; mouse.x = null; mouse.y = null; });

btn.addEventListener("click", () => {
  btn.textContent = "Okay you win 🥲";
});

function distanceToMouseFromButtonCenter() {
  if (!mouse.inside || mouse.x == null) return Infinity;
  const { b } = getRects();
  const cx = pos.x + b.width / 2;
  const cy = pos.y + b.height / 2;
  return Math.hypot(cx - mouse.x, cy - mouse.y);
}

// 0..1 where 0 = far away, 1 = right on top of it (within repel radius)
function proximity01(dist) {
  if (!isFinite(dist)) return 0;
  const t = 1 - clamp(dist / repelRadius, 0, 1);
  // Slight curve so it stays gentle until you’re pretty close
  return t * t;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

// Score how “safe” a target is: higher is better (away from edges/corners)
function safetyScore(x, y, maxX, maxY) {
  const dL = x;
  const dR = maxX - x;
  const dT = y;
  const dB = maxY - y;
  const minEdge = Math.min(dL, dR, dT, dB); // distance to nearest edge
  // Reward being away from edges; clamp to 0..1-ish
  return clamp(minEdge / safeMargin, 0, 1);
}

function pickNearbyTargetAwayFromMouse() {
  const now = Date.now();
  if (now - lastRetarget < retargetCooldownMs) return;
  lastRetarget = now;

  const { a, b } = getRects();
  const maxX = a.width  - b.width;
  const maxY = a.height - b.height;

  // Direction away from mouse
  let awayX = 0, awayY = 0;
  if (mouse.inside && mouse.x != null) {
    const cx = pos.x + b.width / 2;
    const cy = pos.y + b.height / 2;
    const dx = cx - mouse.x;
    const dy = cy - mouse.y;
    const d  = Math.hypot(dx, dy) || 1;
    awayX = dx / d;
    awayY = dy / d;
  } else {
    const ang = Math.random() * Math.PI * 2;
    awayX = Math.cos(ang);
    awayY = Math.sin(ang);
  }

  // We’ll sample a few candidate targets and pick the “best”
  let best = { x: target.x, y: target.y, score: -Infinity };

  const candidates = 10;
  for (let i = 0; i < candidates; i++) {
    const dist = jumpMin + Math.random() * (jumpMax - jumpMin);

    // Small sideways jitter so it doesn’t look too robotic
    const jitterAng = (Math.random() - 0.5) * (Math.PI / 2); // +/-45°
    const cos = Math.cos(jitterAng), sin = Math.sin(jitterAng);
    const dirX = awayX * cos - awayY * sin;
    const dirY = awayX * sin + awayY * cos;

    let nx = pos.x + dirX * dist;
    let ny = pos.y + dirY * dist;

    // Add a gentle “center bias” (avoid corners/edges)
    // We nudge candidates toward the center based on edgeAvoidanceStrength.
    const centerX = maxX / 2;
    const centerY = maxY / 2;
    nx = lerp(nx, centerX, edgeAvoidanceStrength * 0.10);
    ny = lerp(ny, centerY, edgeAvoidanceStrength * 0.10);

    nx = clamp(nx, 0, maxX);
    ny = clamp(ny, 0, maxY);

    // Score candidate:
    // - prefer not too close to mouse
    // - prefer safer (away from edges/corners)
    let mouseScore = 0;
    if (mouse.inside && mouse.x != null) {
      const cX = nx + b.width / 2;
      const cY = ny + b.height / 2;
      const dMouse = Math.hypot(cX - mouse.x, cY - mouse.y);
      mouseScore = clamp(dMouse / repelRadius, 0, 1);
    } else {
      mouseScore = 1;
    }

    const safe = safetyScore(nx, ny, maxX, maxY);

    // Weighted total score (safety matters a lot for avoiding corners)
    const total = (mouseScore * 0.55) + (safe * 0.45);

    if (total > best.score) best = { x: nx, y: ny, score: total };
  }

  target.x = best.x;
  target.y = best.y;
}

function animate() {
  const dist = distanceToMouseFromButtonCenter();

  // Retarget when close
  if (dist < repelRadius) pickNearbyTargetAwayFromMouse();

  // Dynamic ease: gentle far, faster close
  const p = proximity01(dist); // 0..1
  const ease = lerp(easeFar, easeNear, p);

  // Glide
  pos.x += (target.x - pos.x) * ease;
  pos.y += (target.y - pos.y) * ease;

  btn.style.left = `${pos.x}px`;
  btn.style.top  = `${pos.y}px`;

  requestAnimationFrame(animate);
}

window.addEventListener("resize", setCenterStart);
setCenterStart();
requestAnimationFrame(animate);
