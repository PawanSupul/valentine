const arena = document.getElementById("arena");
const btn   = document.getElementById("btn");

// --- TWEAK THESE ---
const repelRadius   = 140;
const jumpMin       = 70;
const jumpMax       = 1180;
const ease          = 0.14;
const retargetCooldownMs = 50 //220;
// -------------------

let pos = { x: 0, y: 0 };
let target = { x: 0, y: 0 };

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

function distanceToMouseFromButtonCenter() {
  if (!mouse.inside || mouse.x == null) return Infinity;
  const { b } = getRects();
  const cx = pos.x + b.width / 2;
  const cy = pos.y + b.height / 2;
  return Math.hypot(cx - mouse.x, cy - mouse.y);
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

  const dist = jumpMin + Math.random() * (jumpMax - jumpMin);

  // Add some sideways randomness
  const jitterAng = (Math.random() - 0.5) * (Math.PI / 2); // +/- 45°
  const cos = Math.cos(jitterAng), sin = Math.sin(jitterAng);
  const dirX = awayX * cos - awayY * sin;
  const dirY = awayX * sin + awayY * cos;

  let nx = pos.x + dirX * dist;
  let ny = pos.y + dirY * dist;

  nx = clamp(nx, 0, maxX);
  ny = clamp(ny, 0, maxY);

  // Try to avoid landing too close to mouse
  for (let i = 0; i < 4; i++) {
    if (!mouse.inside) break;
    const centerX = nx + b.width / 2;
    const centerY = ny + b.height / 2;
    if (Math.hypot(centerX - mouse.x, centerY - mouse.y) > repelRadius * 0.8) break;

    nx = clamp(pos.x + (Math.random()*2-1) * jumpMax, 0, maxX);
    ny = clamp(pos.y + (Math.random()*2-1) * jumpMax, 0, maxY);
  }

  target.x = nx;
  target.y = ny;
}

btn.addEventListener("click", () => {
  btn.textContent = "You got me! 🥲";
});

function animate() {
  if (distanceToMouseFromButtonCenter() < repelRadius) {
    pickNearbyTargetAwayFromMouse();
  }

  pos.x += (target.x - pos.x) * ease;
  pos.y += (target.y - pos.y) * ease;

  btn.style.left = `${pos.x}px`;
  btn.style.top  = `${pos.y}px`;

  requestAnimationFrame(animate);
}

window.addEventListener("resize", setCenterStart);
setCenterStart();
requestAnimationFrame(animate);
